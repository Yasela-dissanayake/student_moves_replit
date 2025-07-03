/**
 * Chat Routes for Student Portal
 * Handles REST API routes for chat functionality
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storage as dbStorage } from './storage';
import { z } from 'zod';
import { CustomAIService } from './ai-services';
import { executeAIOperation } from './ai-service-manager';
import sharp from 'sharp';

// Configure storage for uploaded chat files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine subdirectory based on mime type
    let subdir = 'documents';
    if (file.mimetype.startsWith('image/')) {
      subdir = 'images';
    } else if (file.mimetype.startsWith('video/')) {
      subdir = 'videos';
    } else if (file.mimetype.startsWith('audio/')) {
      subdir = 'audio';
    }
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'chat', subdir);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Schema for creating a new conversation
const createConversationSchema = z.object({
  title: z.string().optional(),
  type: z.enum(['direct', 'group']),
  participants: z.array(z.number()).min(1),
  isPublic: z.boolean().optional().default(false),
  isEncrypted: z.boolean().optional().default(true),
  description: z.string().optional(),
  avatar: z.string().optional()
});

// Schema for sending a message
const sendMessageSchema = z.object({
  conversationId: z.number(),
  content: z.string().optional(),
  replyToId: z.number().optional()
});

// Export main routes function
export default function chatRoutes(dbStorage: any, aiService: CustomAIService) {
  const router = express.Router();
  
  // Public test endpoint for emoji suggestions (no auth required)
  router.post('/test-emoji-suggestions', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Text is required'
        });
      }
      
      // Get emoji suggestions from AI service
      const suggestions = await getAiEmojiSuggestions(text, aiService);
      
      return res.json({
        status: 'success',
        suggestions
      });
    } catch (error) {
      console.error('[chat-routes] Error in test emoji suggestions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to generate emoji suggestions'
      });
    }
  });

  // Authentication middleware
  const authenticateUser = async (req: Request, res: Response, next: Function) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    } catch (error) {
      console.error('[chat-routes] Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };

  // Apply authentication to all routes
  router.use(authenticateUser);

  // Get all conversations for the current user
  router.get('/conversations', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;

      // Get conversations with message counts and last message time
      const conversations = await dbStorage.query(
        `SELECT c.*, 
            (SELECT COUNT(*) FROM chat_messages cm WHERE cm.conversation_id = c.id) as message_count,
            (SELECT MAX(cm2.sent_at) FROM chat_messages cm2 WHERE cm2.conversation_id = c.id) as last_message_time
         FROM chat_conversations c
         JOIN chat_participants cp ON c.id = cp.conversation_id
         WHERE cp.user_id = $1 AND cp.left_at IS NULL
         ORDER BY COALESCE(c.last_message_at, c.created_at) DESC`,
        [userId]
      );

      // Format conversations with additional data
      const formattedConversations = await Promise.all(conversations.map(async (conv) => {
        // Get conversation participants
        const participants = await dbStorage.query(
          `SELECT cp.*, u.name, u.email, u.profile_image, u.user_type
           FROM chat_participants cp
           JOIN users u ON cp.user_id = u.id
           WHERE cp.conversation_id = $1 AND cp.left_at IS NULL`,
          [conv.id]
        );

        // Get last message
        const lastMessages = await dbStorage.query(
          `SELECT cm.*, u.name as sender_name, u.profile_image as sender_image
           FROM chat_messages cm
           JOIN users u ON cm.sender_id = u.id
           WHERE cm.conversation_id = $1
           ORDER BY cm.sent_at DESC
           LIMIT 1`,
          [conv.id]
        );

        const lastMessage = lastMessages.length > 0 ? lastMessages[0] : null;

        // Calculate unread count for this user
        const unreadCount = await dbStorage.query(
          `SELECT COUNT(*) as count
           FROM chat_messages cm
           WHERE cm.conversation_id = $1
           AND cm.sender_id != $2
           AND NOT EXISTS (
             SELECT 1 FROM jsonb_array_elements(cm.read_by) as rb
             WHERE (rb->>'userId')::integer = $2
           )`,
          [conv.id, userId]
        );

        return {
          ...conv,
          participants,
          lastMessage,
          unreadCount: unreadCount[0]?.count || 0
        };
      }));

      res.json({ success: true, conversations: formattedConversations });
    } catch (error) {
      console.error('[chat-routes] Error fetching conversations:', error);
      res.status(500).json({ error: 'Failed to retrieve conversations' });
    }
  });

  // Get a specific conversation by ID
  router.get('/conversations/:id', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session.userId;

      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      // Check if user is a participant
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      // Get conversation details
      const conversation = await dbStorage.query(
        `SELECT * FROM chat_conversations WHERE id = $1`,
        [conversationId]
      );

      if (conversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Get participants
      const participants = await dbStorage.query(
        `SELECT cp.*, u.name, u.email, u.profile_image, u.user_type
         FROM chat_participants cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.conversation_id = $1 AND cp.left_at IS NULL`,
        [conversationId]
      );

      // Get messages
      const messages = await dbStorage.query(
        `SELECT cm.*, u.name as sender_name, u.profile_image as sender_image
         FROM chat_messages cm
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.conversation_id = $1
         ORDER BY cm.sent_at DESC
         LIMIT 50`,
        [conversationId]
      );

      // Get message reactions
      const messageIds = messages.map(m => m.id);
      let reactions = [];
      
      if (messageIds.length > 0) {
        reactions = await dbStorage.query(
          `SELECT cmr.*, u.name as user_name
           FROM chat_message_reactions cmr
           JOIN users u ON cmr.user_id = u.id
           WHERE cmr.message_id = ANY($1)`,
          [messageIds]
        );
      }

      // Group reactions by message ID
      const messageReactions = {};
      reactions.forEach(reaction => {
        if (!messageReactions[reaction.message_id]) {
          messageReactions[reaction.message_id] = [];
        }
        messageReactions[reaction.message_id].push(reaction);
      });

      // Add reactions to messages
      messages.forEach(message => {
        message.reactions = messageReactions[message.id] || [];
      });

      // Mark messages as read
      await markMessagesAsRead(conversationId, userId, dbStorage);

      res.json({
        success: true,
        conversation: {
          ...conversation[0],
          participants,
          messages: messages.reverse() // Return in chronological order
        }
      });
    } catch (error) {
      console.error('[chat-routes] Error fetching conversation:', error);
      res.status(500).json({ error: 'Failed to retrieve conversation' });
    }
  });

  // Create a new conversation
  router.post('/conversations', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const validationResult = createConversationSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validationResult.error.format()
        });
      }

      const { 
        title, 
        type, 
        participants, 
        isPublic = false,
        isEncrypted = true,
        description,
        avatar
      } = validationResult.data;

      // For direct messages, only allow 1 participant (the other user)
      if (type === 'direct' && participants.length !== 1) {
        return res.status(400).json({ 
          error: 'Direct conversations must have exactly one recipient' 
        });
      }

      // Check if direct conversation already exists
      if (type === 'direct') {
        const existingConversation = await dbStorage.query(
          `SELECT c.id FROM chat_conversations c
           JOIN chat_participants p1 ON c.id = p1.conversation_id
           JOIN chat_participants p2 ON c.id = p2.conversation_id
           WHERE c.type = 'direct'
           AND p1.user_id = $1
           AND p2.user_id = $2
           AND p1.left_at IS NULL
           AND p2.left_at IS NULL
           LIMIT 1`,
          [userId, participants[0]]
        );

        if (existingConversation.length > 0) {
          const conversationId = existingConversation[0].id;
          
          // Get formatted conversation
          const conversation = await getFormattedConversation(
            conversationId, 
            userId,
            dbStorage
          );

          return res.json({ 
            success: true, 
            conversation,
            existing: true
          });
        }
      }

      // Create the new conversation
      const allParticipants = [userId, ...participants];
      
      const newConversation = await dbStorage.query(
        `INSERT INTO chat_conversations (
          title,
          type,
          created_by,
          created_at,
          updated_at,
          is_public,
          is_encrypted,
          description,
          avatar
        ) VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7)
        RETURNING *`,
        [
          title || null,
          type,
          userId,
          isPublic,
          isEncrypted,
          description || null,
          avatar || null
        ]
      );

      const conversationId = newConversation[0].id;

      // Add participants
      for (const participantId of allParticipants) {
        await dbStorage.query(
          `INSERT INTO chat_participants (
            conversation_id,
            user_id,
            joined_at,
            role,
            can_send_messages,
            can_add_participants,
            can_remove_participants,
            can_edit_settings
          ) VALUES ($1, $2, NOW(), $3, true, $4, $5, $6)`,
          [
            conversationId,
            participantId,
            participantId === userId ? 'admin' : 'member',
            participantId === userId, // Only creator can add participants
            participantId === userId, // Only creator can remove participants
            participantId === userId  // Only creator can edit settings
          ]
        );
      }

      // Add system message about conversation creation
      await dbStorage.query(
        `INSERT INTO chat_messages (
          conversation_id,
          sender_id,
          type,
          content,
          security_status,
          sent_at,
          created_at,
          updated_at
        ) VALUES ($1, $2, 'system', $3, 'passed', NOW(), NOW(), NOW())`,
        [
          conversationId,
          userId,
          type === 'direct' 
            ? 'Conversation started' 
            : `Group "${title || 'Untitled'}" created`
        ]
      );

      // Get formatted conversation
      const formattedConversation = await getFormattedConversation(
        conversationId,
        userId,
        dbStorage
      );

      res.status(201).json({
        success: true,
        conversation: formattedConversation
      });
    } catch (error) {
      console.error('[chat-routes] Error creating conversation:', error);
      res.status(500).json({ error: 'Failed to create conversation' });
    }
  });

  // Add participants to a group conversation
  router.post('/conversations/:id/participants', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { participants } = req.body;

      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      if (!Array.isArray(participants) || participants.length === 0) {
        return res.status(400).json({ error: 'No participants specified' });
      }

      // Check if the conversation exists and is a group
      const conversation = await dbStorage.query(
        `SELECT * FROM chat_conversations WHERE id = $1`,
        [conversationId]
      );

      if (conversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      if (conversation[0].type !== 'group') {
        return res.status(400).json({ error: 'Cannot add participants to direct conversations' });
      }

      // Check if the user has permission to add participants
      const userParticipant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (userParticipant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      if (!userParticipant[0].can_add_participants) {
        return res.status(403).json({ error: 'You do not have permission to add participants' });
      }

      // Get existing participants to avoid duplicates
      const existingParticipants = await dbStorage.query(
        `SELECT user_id FROM chat_participants
         WHERE conversation_id = $1 AND left_at IS NULL`,
        [conversationId]
      );

      const existingIds = new Set(existingParticipants.map(p => p.user_id));
      const newParticipants = participants.filter(p => !existingIds.has(p));

      if (newParticipants.length === 0) {
        return res.status(400).json({ error: 'All users are already participants' });
      }

      // Add new participants
      for (const participantId of newParticipants) {
        await dbStorage.query(
          `INSERT INTO chat_participants (
            conversation_id,
            user_id,
            joined_at,
            role,
            can_send_messages,
            can_add_participants,
            can_remove_participants,
            can_edit_settings
          ) VALUES ($1, $2, NOW(), 'member', true, false, false, false)`,
          [conversationId, participantId]
        );
      }

      // Get user names for system message
      const userNames = await dbStorage.query(
        `SELECT id, name FROM users WHERE id = ANY($1)`,
        [newParticipants]
      );

      const nameMap = {};
      userNames.forEach(u => {
        nameMap[u.id] = u.name;
      });

      // Add system message
      const addedNames = newParticipants.map(id => nameMap[id] || `User ${id}`).join(', ');
      await dbStorage.query(
        `INSERT INTO chat_messages (
          conversation_id,
          sender_id,
          type,
          content,
          security_status,
          sent_at,
          created_at,
          updated_at
        ) VALUES ($1, $2, 'system', $3, 'passed', NOW(), NOW(), NOW())`,
        [
          conversationId,
          userId,
          `${userParticipant[0].name || 'User'} added ${addedNames} to the group`
        ]
      );

      // Get updated participant list
      const updatedParticipants = await dbStorage.query(
        `SELECT cp.*, u.name, u.email, u.profile_image, u.user_type
         FROM chat_participants cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.conversation_id = $1 AND cp.left_at IS NULL`,
        [conversationId]
      );

      res.json({
        success: true,
        participants: updatedParticipants,
        added: newParticipants
      });
    } catch (error) {
      console.error('[chat-routes] Error adding participants:', error);
      res.status(500).json({ error: 'Failed to add participants' });
    }
  });

  // Update conversation details (title, avatar, description, etc.)
  router.put('/conversations/:id', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { title, description, avatar, isPublic, isEncrypted } = req.body;

      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      // Check if the conversation exists
      const conversation = await dbStorage.query(
        `SELECT * FROM chat_conversations WHERE id = $1`,
        [conversationId]
      );

      if (conversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Can't update direct conversation details
      if (conversation[0].type === 'direct') {
        return res.status(400).json({ error: 'Cannot update direct conversation details' });
      }

      // Check if the user has permission to edit settings
      const userParticipant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (userParticipant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      if (!userParticipant[0].can_edit_settings) {
        return res.status(403).json({ error: 'You do not have permission to edit conversation settings' });
      }

      // Update conversation
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (title !== undefined) {
        updateFields.push(`title = $${paramCount++}`);
        updateValues.push(title);
      }

      if (description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(description);
      }

      if (avatar !== undefined) {
        updateFields.push(`avatar = $${paramCount++}`);
        updateValues.push(avatar);
      }

      if (isPublic !== undefined) {
        updateFields.push(`is_public = $${paramCount++}`);
        updateValues.push(isPublic);
      }

      if (isEncrypted !== undefined) {
        updateFields.push(`is_encrypted = $${paramCount++}`);
        updateValues.push(isEncrypted);
      }

      // Add updated_at field
      updateFields.push(`updated_at = NOW()`);

      // Only proceed if there are fields to update
      if (updateFields.length === 1) { // Only updated_at
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      const updateQuery = `
        UPDATE chat_conversations
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      updateValues.push(conversationId);

      const updatedConversation = await dbStorage.query(updateQuery, updateValues);

      // Add system message about the update
      await dbStorage.query(
        `INSERT INTO chat_messages (
          conversation_id,
          sender_id,
          type,
          content,
          security_status,
          sent_at,
          created_at,
          updated_at
        ) VALUES ($1, $2, 'system', $3, 'passed', NOW(), NOW(), NOW())`,
        [
          conversationId,
          userId,
          `Group settings updated by ${userParticipant[0].name || 'User'}`
        ]
      );

      res.json({
        success: true,
        conversation: updatedConversation[0]
      });
    } catch (error) {
      console.error('[chat-routes] Error updating conversation:', error);
      res.status(500).json({ error: 'Failed to update conversation' });
    }
  });

  // Get messages for a conversation
  router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session.userId;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before ? new Date(req.query.before as string) : null;

      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      // Check if user is a participant
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      // Get messages with pagination
      let query = `
        SELECT cm.*, u.name as sender_name, u.profile_image as sender_image
        FROM chat_messages cm
        JOIN users u ON cm.sender_id = u.id
        WHERE cm.conversation_id = $1
      `;
      const queryParams = [conversationId];

      if (before) {
        query += ` AND cm.sent_at < $2`;
        queryParams.push(before);
      }

      query += ` ORDER BY cm.sent_at DESC LIMIT $${queryParams.length + 1}`;
      queryParams.push(limit);

      const messages = await dbStorage.query(query, queryParams);

      // Get reactions for these messages
      const messageIds = messages.map(m => m.id);
      let reactions = [];
      
      if (messageIds.length > 0) {
        reactions = await dbStorage.query(
          `SELECT cmr.*, u.name as user_name
           FROM chat_message_reactions cmr
           JOIN users u ON cmr.user_id = u.id
           WHERE cmr.message_id = ANY($1)`,
          [messageIds]
        );
      }

      // Group reactions by message ID
      const messageReactions = {};
      reactions.forEach(reaction => {
        if (!messageReactions[reaction.message_id]) {
          messageReactions[reaction.message_id] = [];
        }
        messageReactions[reaction.message_id].push(reaction);
      });

      // Add reactions to messages
      messages.forEach(message => {
        message.reactions = messageReactions[message.id] || [];
      });

      // Mark messages as read
      await markMessagesAsRead(conversationId, userId, dbStorage);

      res.json({
        success: true,
        messages: messages.reverse(), // Return in chronological order
        hasMore: messages.length === limit
      });
    } catch (error) {
      console.error('[chat-routes] Error fetching messages:', error);
      res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  });

  // Send a message with text content only
  router.post('/messages', async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const validationResult = sendMessageSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request data',
          details: validationResult.error.format()
        });
      }

      const { conversationId, content, replyToId } = validationResult.data;

      // Check if user is a participant and can send messages
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      if (!participant[0].can_send_messages) {
        return res.status(403).json({ error: 'You do not have permission to send messages' });
      }

      // Validate content
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Message content cannot be empty' });
      }

      // Check if AI moderation is enabled for this conversation
      const conversation = await dbStorage.query(
        `SELECT * FROM chat_conversations WHERE id = $1`,
        [conversationId]
      );
      
      if (conversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      const moderationEnabled = conversation[0]?.moderationEnabled;
      let securityStatus = 'pending';
      let securityDetails = null;

      // Perform AI content moderation if enabled
      if (moderationEnabled) {
        try {
          const moderationResult = await executeAIOperation('moderation', {
            text: content,
            threshold: 0.7
          });

          if (moderationResult.error) {
            console.error('[chat-routes] Moderation error:', moderationResult.error);
            securityStatus = 'pending'; // Default to pending if moderation fails
          } else {
            const { flagged, categories, scores } = moderationResult.result;
            
            if (!flagged) {
              securityStatus = 'passed';
            } else {
              // Create details for flagged categories
              const details = Object.entries(categories)
                .filter(([_, flagged]) => flagged)
                .map(([category, _]) => ({
                  category,
                  confidence: scores[category] || 0
                }));

              // Check for high-risk categories that warrant blocking
              const highRiskCategories = ['violence', 'sexual', 'hate', 'self-harm', 'harassment'];
              const highRisk = details.some(
                detail => highRiskCategories.includes(detail.category) && detail.confidence > 0.85
              );

              securityStatus = highRisk ? 'blocked' : 'flagged';
              securityDetails = { flagged, categories, scores, details };
              
              if (highRisk) {
                return res.status(400).json({
                  error: 'Message blocked',
                  reason: 'Content violates community guidelines',
                  details
                });
              }
            }
          }
        } catch (error) {
          console.error('[chat-routes] Moderation error:', error);
          // Continue with pending status
        }
      }

      // Create the message
      const newMessage = await dbStorage.query(
        `INSERT INTO chat_messages (
          conversation_id,
          sender_id,
          reply_to_id,
          type,
          content,
          security_status,
          security_details,
          status,
          sent_at,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, 'text', $4, $5, $6, 'sent', NOW(), NOW(), NOW())
        RETURNING *`,
        [
          conversationId,
          userId,
          replyToId || null,
          content,
          securityStatus,
          securityDetails ? JSON.stringify(securityDetails) : null
        ]
      );

      // Update conversation's last_message_at
      await dbStorage.query(
        `UPDATE chat_conversations 
         SET last_message_at = NOW(), updated_at = NOW() 
         WHERE id = $1`,
        [conversationId]
      );

      // Get sender info
      const sender = await dbStorage.query(
        `SELECT name, profile_image FROM users WHERE id = $1`,
        [userId]
      );

      // Format message with sender info
      const formattedMessage = {
        ...newMessage[0],
        sender_name: sender[0].name,
        sender_image: sender[0].profile_image,
        reactions: []
      };

      // Mark as read by sender
      const readBy = [{
        userId,
        readAt: new Date().toISOString()
      }];
      
      await dbStorage.query(
        `UPDATE chat_messages SET read_by = $1 WHERE id = $2`,
        [JSON.stringify(readBy), formattedMessage.id]
      );

      res.status(201).json({
        success: true,
        message: formattedMessage
      });
    } catch (error) {
      console.error('[chat-routes] Error sending message:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Send a message with media content
  router.post('/messages/media', upload.single('media'), async (req: Request, res: Response) => {
    try {
      const userId = req.session.userId;
      const { conversationId, content, replyToId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No media file provided' });
      }

      if (!conversationId || isNaN(parseInt(conversationId))) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      // Check if user is a participant and can send messages
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      if (!participant[0].can_send_messages) {
        return res.status(403).json({ error: 'You do not have permission to send messages' });
      }

      // Determine message type based on MIME type
      let messageType = 'document';
      if (file.mimetype.startsWith('image/')) {
        messageType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        messageType = 'video';
      } else if (file.mimetype.startsWith('audio/')) {
        messageType = 'audio';
      }

      // Process media file
      let mediaThumbnailUrl = null;
      let mediaWidth = null;
      let mediaHeight = null;
      let mediaDuration = null;

      // Generate thumbnail for images
      if (messageType === 'image') {
        try {
          const thumbFilename = `thumb-${path.basename(file.filename)}`;
          const thumbPath = path.join(path.dirname(file.path), thumbFilename);
          
          // Get image dimensions
          const metadata = await sharp(file.path).metadata();
          mediaWidth = metadata.width;
          mediaHeight = metadata.height;
          
          // Create thumbnail
          await sharp(file.path)
            .resize({ width: 300, height: 300, fit: 'inside' })
            .jpeg({ quality: 80 })
            .toFile(thumbPath);
          
          // Generate thumbnail URL
          const subdir = file.mimetype.startsWith('image/') ? 'images' : 
                        file.mimetype.startsWith('video/') ? 'videos' : 
                        file.mimetype.startsWith('audio/') ? 'audio' : 
                        'documents';
          mediaThumbnailUrl = `/uploads/chat/${subdir}/${thumbFilename}`;
        } catch (error) {
          console.error('[chat-routes] Error generating thumbnail:', error);
          // Continue without thumbnail
        }
      }

      // Check if AI scan is enabled for this conversation
      const conversation = await dbStorage.query(
        `SELECT * FROM chat_conversations WHERE id = $1`,
        [conversationId]
      );
      
      if (conversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
      
      const aiScanEnabled = conversation[0]?.aiScanEnabled;
      let securityStatus = 'pending';

      // Create the message
      const newMessage = await dbStorage.query(
        `INSERT INTO chat_messages (
          conversation_id,
          sender_id,
          reply_to_id,
          type,
          content,
          media_url,
          media_thumbnail_url,
          media_type,
          media_size,
          media_width,
          media_height,
          media_duration,
          media_name,
          security_status,
          status,
          sent_at,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'sent', NOW(), NOW(), NOW())
        RETURNING *`,
        [
          conversationId,
          userId,
          replyToId || null,
          messageType,
          content || null,
          `/uploads/chat/${file.destination.split('/').pop()}/${file.filename}`,
          mediaThumbnailUrl,
          file.mimetype,
          file.size,
          mediaWidth,
          mediaHeight,
          mediaDuration,
          file.originalname,
          securityStatus
        ]
      );

      // Update conversation's last_message_at
      await dbStorage.query(
        `UPDATE chat_conversations 
         SET last_message_at = NOW(), updated_at = NOW() 
         WHERE id = $1`,
        [conversationId]
      );

      // Get sender info
      const sender = await dbStorage.query(
        `SELECT name, profile_image FROM users WHERE id = $1`,
        [userId]
      );

      // Format message with sender info
      const formattedMessage = {
        ...newMessage[0],
        sender_name: sender[0].name,
        sender_image: sender[0].profile_image,
        reactions: []
      };

      // Mark as read by sender
      const readBy = [{
        userId,
        readAt: new Date().toISOString()
      }];
      
      await dbStorage.query(
        `UPDATE chat_messages SET read_by = $1 WHERE id = $2`,
        [JSON.stringify(readBy), formattedMessage.id]
      );

      // Schedule media scan if enabled
      if (aiScanEnabled && messageType === 'image') {
        scheduleMediaScan(
          formattedMessage.id,
          formattedMessage.media_url,
          formattedMessage.media_type,
          aiService
        );
      }

      res.status(201).json({
        success: true,
        message: formattedMessage
      });
    } catch (error) {
      console.error('[chat-routes] Error sending media message:', error);
      res.status(500).json({ error: 'Failed to send media message' });
    }
  });

  // Add reaction to a message
  router.post('/messages/:id/reactions', async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.session.userId;
      const { reaction } = req.body;

      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      if (!reaction || typeof reaction !== 'string') {
        return res.status(400).json({ error: 'Reaction is required' });
      }

      // Get message details
      const message = await dbStorage.query(
        `SELECT * FROM chat_messages WHERE id = $1`,
        [messageId]
      );

      if (message.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user is a participant in the conversation
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [message[0].conversation_id, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      // Check if reaction already exists
      const existingReaction = await dbStorage.query(
        `SELECT * FROM chat_message_reactions 
         WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
        [messageId, userId, reaction]
      );

      if (existingReaction.length > 0) {
        return res.status(400).json({ error: 'Reaction already exists' });
      }

      // Add reaction
      const newReaction = await dbStorage.query(
        `INSERT INTO chat_message_reactions (
          message_id, user_id, reaction, created_at
        ) VALUES ($1, $2, $3, NOW()) RETURNING *`,
        [messageId, userId, reaction]
      );

      // Get user info
      const user = await dbStorage.query(
        `SELECT name FROM users WHERE id = $1`,
        [userId]
      );

      // Format reaction with user info
      const formattedReaction = {
        ...newReaction[0],
        user_name: user[0].name
      };

      res.status(201).json({
        success: true,
        reaction: formattedReaction
      });
    } catch (error) {
      console.error('[chat-routes] Error adding reaction:', error);
      res.status(500).json({ error: 'Failed to add reaction' });
    }
  });

  // Remove reaction from a message
  router.delete('/messages/:messageId/reactions/:reaction', async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const userId = req.session.userId;
      const { reaction } = req.params;

      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      // Get message details
      const message = await dbStorage.query(
        `SELECT * FROM chat_messages WHERE id = $1`,
        [messageId]
      );

      if (message.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user is a participant in the conversation
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [message[0].conversation_id, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      // Delete reaction
      const result = await dbStorage.query(
        `DELETE FROM chat_message_reactions 
         WHERE message_id = $1 AND user_id = $2 AND reaction = $3
         RETURNING *`,
        [messageId, userId, reaction]
      );

      if (result.length === 0) {
        return res.status(404).json({ error: 'Reaction not found' });
      }

      res.json({
        success: true,
        message: 'Reaction removed successfully'
      });
    } catch (error) {
      console.error('[chat-routes] Error removing reaction:', error);
      res.status(500).json({ error: 'Failed to remove reaction' });
    }
  });

  // Leave a group conversation
  router.post('/conversations/:id/leave', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session.userId;

      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      // Check if the conversation exists
      const conversation = await dbStorage.query(
        `SELECT * FROM chat_conversations WHERE id = $1`,
        [conversationId]
      );

      if (conversation.length === 0) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      // Can't leave direct conversations
      if (conversation[0].type === 'direct') {
        return res.status(400).json({ error: 'Cannot leave direct conversations' });
      }

      // Check if user is a participant
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      // Get user info for system message
      const user = await dbStorage.query(
        `SELECT name FROM users WHERE id = $1`,
        [userId]
      );

      // Update participant record
      await dbStorage.query(
        `UPDATE chat_participants 
         SET left_at = NOW() 
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      // Add system message about leaving
      await dbStorage.query(
        `INSERT INTO chat_messages (
          conversation_id,
          sender_id,
          type,
          content,
          security_status,
          sent_at,
          created_at,
          updated_at
        ) VALUES ($1, $2, 'system', $3, 'passed', NOW(), NOW(), NOW())`,
        [
          conversationId,
          userId,
          `${user[0].name} left the group`
        ]
      );

      res.json({
        success: true,
        message: 'Left conversation successfully'
      });
    } catch (error) {
      console.error('[chat-routes] Error leaving conversation:', error);
      res.status(500).json({ error: 'Failed to leave conversation' });
    }
  });

  // Delete a message (mark as deleted)
  router.delete('/messages/:id', async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      const userId = req.session.userId;

      if (isNaN(messageId)) {
        return res.status(400).json({ error: 'Invalid message ID' });
      }

      // Get message details
      const message = await dbStorage.query(
        `SELECT * FROM chat_messages WHERE id = $1`,
        [messageId]
      );

      if (message.length === 0) {
        return res.status(404).json({ error: 'Message not found' });
      }

      // Check if user is the sender
      if (message[0].sender_id !== userId) {
        return res.status(403).json({ error: 'You can only delete your own messages' });
      }

      // Update message status
      await dbStorage.query(
        `UPDATE chat_messages SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
        [messageId]
      );

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('[chat-routes] Error deleting message:', error);
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  // Mark messages as read in a conversation
  router.post('/conversations/:id/read', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session.userId;

      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      // Check if user is a participant
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      // Mark messages as read
      await markMessagesAsRead(conversationId, userId, dbStorage);

      res.json({
        success: true,
        message: 'Messages marked as read'
      });
    } catch (error) {
      console.error('[chat-routes] Error marking messages as read:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  });

  // Search for messages in a conversation
  router.get('/conversations/:id/search', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.session.userId;
      const query = req.query.q as string;

      if (isNaN(conversationId)) {
        return res.status(400).json({ error: 'Invalid conversation ID' });
      }

      if (!query || query.trim() === '') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Check if user is a participant
      const participant = await dbStorage.query(
        `SELECT * FROM chat_participants
         WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (participant.length === 0) {
        return res.status(403).json({ error: 'You are not a participant in this conversation' });
      }

      // Search for messages
      const messages = await dbStorage.query(
        `SELECT cm.*, u.name as sender_name, u.profile_image as sender_image
         FROM chat_messages cm
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.conversation_id = $1
         AND cm.status != 'deleted'
         AND cm.content ILIKE $2
         ORDER BY cm.sent_at DESC
         LIMIT 50`,
        [conversationId, `%${query}%`]
      );

      // Get reactions for these messages
      const messageIds = messages.map(m => m.id);
      let reactions = [];
      
      if (messageIds.length > 0) {
        reactions = await dbStorage.query(
          `SELECT cmr.*, u.name as user_name
           FROM chat_message_reactions cmr
           JOIN users u ON cmr.user_id = u.id
           WHERE cmr.message_id = ANY($1)`,
          [messageIds]
        );
      }

      // Group reactions by message ID
      const messageReactions = {};
      reactions.forEach(reaction => {
        if (!messageReactions[reaction.message_id]) {
          messageReactions[reaction.message_id] = [];
        }
        messageReactions[reaction.message_id].push(reaction);
      });

      // Add reactions to messages
      messages.forEach(message => {
        message.reactions = messageReactions[message.id] || [];
      });

      res.json({
        success: true,
        messages,
        query
      });
    } catch (error) {
      console.error('[chat-routes] Error searching messages:', error);
      res.status(500).json({ error: 'Failed to search messages' });
    }
  });

  // AI Emoji Suggestions API endpoint (with authentication)
  router.post('/emoji-suggestions', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          status: 'error',
          message: 'Text is required'
        });
      }
      
      // Get emoji suggestions from AI service
      const suggestions = await getAiEmojiSuggestions(text, aiService);
      
      // Cache the result for this user session (optional performance improvement)
      const userId = req.session.userId;
      if (userId) {
        // Could implement per-user suggestion caching here in the future
      }
      
      return res.json({
        status: 'success',
        suggestions
      });
    } catch (error) {
      console.error('[chat-routes] Error generating emoji suggestions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to generate emoji suggestions'
      });
    }
  });

  return router;
}

/**
 * Use AI to suggest emojis based on message content
 */
async function getAiEmojiSuggestions(text: string, aiService: CustomAIService): Promise<string[]> {
  try {
    // Use AI service to get emoji suggestions
    // Using emoji-suggestions operation from AI service manager
    const response = await executeAIOperation('emoji-suggestions', {
      prompt: `Suggest 5 relevant emojis that would be appropriate to add to this message: "${text}"
      Return ONLY the emojis as a comma-separated list without any explanation or additional text.
      For example: "😀,👍,🎉,❤️,👋"`
    });
    
    // Parse response to get emojis
    if (response && response.trim()) {
      // Clean up response and split by commas
      const emojis = response
        .replace(/["']/g, '') // Remove quotes
        .split(',')
        .map((emoji: string) => emoji.trim())
        .filter((emoji: string) => emoji); // Remove empty strings
      
      // Take up to 5 suggestions
      return emojis.slice(0, 5);
    }
    
    // Fallback to common emojis if no suggestions
    return ["👍", "😊", "👋", "❤️", "🎉"];
  } catch (error) {
    console.error('[chat-routes] AI emoji suggestion error:', error);
    // Return empty array on error
    return [];
  }
}

/**
 * Mark messages as read by a user
 */
async function markMessagesAsRead(
  conversationId: number,
  userId: number,
  dbStorage: Storage
): Promise<void> {
  try {
    // Get all unread messages not sent by this user
    const unreadMessages = await dbStorage.query(
      `SELECT id, read_by FROM chat_messages 
       WHERE conversation_id = $1 
       AND sender_id != $2
       AND NOT EXISTS (
         SELECT 1 FROM jsonb_array_elements(read_by) as rb
         WHERE (rb->>'userId')::integer = $2
       )`,
      [conversationId, userId]
    );
    
    for (const msg of unreadMessages) {
      const readBy = msg.read_by || [];
      readBy.push({
        userId,
        readAt: new Date().toISOString()
      });
      
      await dbStorage.query(
        `UPDATE chat_messages SET read_by = $1 WHERE id = $2`,
        [JSON.stringify(readBy), msg.id]
      );
    }
  } catch (error) {
    console.error('[chat-routes] Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Schedule a media scan for security
 */
function scheduleMediaScan(
  messageId: number,
  mediaUrl: string,
  mediaType: string,
  aiService: CustomAIService
) {
  // This would be implemented with a queue in production
  // For now, we'll do a basic async scan
  setTimeout(async () => {
    try {
      // Use AI to scan the image/media for inappropriate content
      const scanResult = await executeAIOperation('image-moderation', {
        imageUrl: mediaUrl,
        threshold: 0.75
      });
      
      // Update message security status
      const dbPool = await import('./db').then(m => m.db);
      
      if (scanResult.error) {
        console.error('[chat-routes] Media scan error:', scanResult.error);
        return;
      }
      
      const { flagged, categories, scores } = scanResult.result;
      
      if (!flagged) {
        await dbPool.query(
          `UPDATE chat_messages 
           SET security_status = 'passed', 
               security_checked_at = NOW() 
           WHERE id = $1`,
          [messageId]
        );
        return;
      }
      
      // Create details array for flagged categories
      const details = Object.entries(categories)
        .filter(([_, flagged]) => flagged)
        .map(([category, _]) => ({
          category,
          confidence: scores[category] || 0
        }));
      
      // Check for high-risk categories that warrant blocking
      const highRiskCategories = ['violence', 'sexual', 'hate', 'self-harm', 'harassment'];
      const highRisk = details.some(
        detail => highRiskCategories.includes(detail.category) && detail.confidence > 0.9
      );
      
      // Update message security status based on scan results
      await dbPool.query(
        `UPDATE chat_messages 
         SET security_status = $1, 
             security_details = $2, 
             security_checked_at = NOW() 
         WHERE id = $3`,
        [
          highRisk ? 'blocked' : 'flagged',
          JSON.stringify({ flagged, categories, scores, details }),
          messageId
        ]
      );
    } catch (error) {
      console.error('[chat-routes] Error in media scan:', error);
    }
  }, 500);
}

/**
 * Get a fully formatted conversation with participants and messages
 */
async function getFormattedConversation(
  conversationId: number,
  userId: number,
  dbStorage: Storage
): Promise<any> {
  try {
    // Get conversation details
    const conversation = await dbStorage.query(
      `SELECT * FROM chat_conversations WHERE id = $1`,
      [conversationId]
    );
    
    if (conversation.length === 0) {
      throw new Error('Conversation not found');
    }
    
    const conv = conversation[0];
    
    // Get conversation participants
    const participants = await dbStorage.query(
      `SELECT cp.*, u.name, u.email, u.profile_image, u.user_type
       FROM chat_participants cp
       JOIN users u ON cp.user_id = u.id
       WHERE cp.conversation_id = $1 AND cp.left_at IS NULL`,
      [conversationId]
    );
    
    // Get most recent messages
    const messages = await dbStorage.query(
      `SELECT cm.*, u.name as sender_name, u.profile_image as sender_image
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.conversation_id = $1
       ORDER BY cm.sent_at DESC
       LIMIT 20`,
      [conversationId]
    );
    
    // Get message reactions
    const messageIds = messages.map(m => m.id);
    let reactions = [];
    
    if (messageIds.length > 0) {
      reactions = await dbStorage.query(
        `SELECT cmr.*, u.name as user_name
         FROM chat_message_reactions cmr
         JOIN users u ON cmr.user_id = u.id
         WHERE cmr.message_id = ANY($1)`,
        [messageIds]
      );
    }
    
    // Group reactions by message ID
    const messageReactions = {};
    reactions.forEach(reaction => {
      if (!messageReactions[reaction.message_id]) {
        messageReactions[reaction.message_id] = [];
      }
      messageReactions[reaction.message_id].push(reaction);
    });
    
    // Add reactions to messages
    messages.forEach(message => {
      message.reactions = messageReactions[message.id] || [];
    });
    
    // Calculate unread count for this user
    const unreadCount = await dbStorage.query(
      `SELECT COUNT(*) as count
       FROM chat_messages cm
       WHERE cm.conversation_id = $1
       AND cm.sender_id != $2
       AND NOT EXISTS (
         SELECT 1 FROM jsonb_array_elements(cm.read_by) as rb
         WHERE (rb->>'userId')::integer = $2
       )`,
      [conversationId, userId]
    );
    
    // Format response
    return {
      ...conv,
      participants,
      messages: messages.reverse(), // Most recent last
      unreadCount: unreadCount[0]?.count || 0
    };
  } catch (error) {
    console.error('[chat-routes] Error formatting conversation:', error);
    throw error;
  }
}