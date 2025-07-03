/**
 * Chat Service for Student Portal
 * Provides real-time messaging functionality with multimedia support, security scanning, and encryption
 */

import { Server, Socket } from 'socket.io';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { 
  ChatMessage,
  ChatConversation,
  ChatParticipant,
  securityCheckStatusEnum
} from '../shared/schema';
import { storage } from './storage';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import { CustomAIService } from './ai-services';
import { promisify } from 'util';
import sharp from 'sharp';
import { executeAIOperation } from './ai-service-manager';

// Get directory paths for file storage
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CHAT_UPLOADS_DIR = join(process.cwd(), 'uploads', 'chat');

// Ensure chat uploads directory exists
if (!fs.existsSync(CHAT_UPLOADS_DIR)) {
  fs.mkdirSync(CHAT_UPLOADS_DIR, { recursive: true });
}

// Create subdirectories for different media types
const mediaDirectories = ['images', 'videos', 'audio', 'documents'];
for (const dir of mediaDirectories) {
  const path = join(CHAT_UPLOADS_DIR, dir);
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true });
  }
}

// Interface for socket connection with user info
interface UserSocket extends Socket {
  userId?: number;
  userName?: string;
  userType?: string;
}

// Connected users map (userId -> socketId)
const connectedUsers = new Map<number, string>();

// User status map (userId -> {status, lastActive, customStatus})
const userStatusMap = new Map<number, {
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActive: Date;
  customStatus?: string;
}>();

// Active user typing status map (conversationId -> Map<userId, timestamp>)
const typingUsers = new Map<number, Map<number, number>>();

// Cache of recent messages to reduce database load
const messageCache = new Map<number, ChatMessage[]>();
const MESSAGE_CACHE_SIZE = 50;

// Media type helpers
const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const videoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
const audioTypes = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'];
const documentTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

/**
 * Main function to set up the chat server using Socket.IO
 */
export function setupChatServer(
  httpServer: http.Server,
  dbStorage: Storage,
  aiService: CustomAIService
): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 5 * 1024 * 1024, // 5MB, for file uploads
    path: '/socket.io/chat'
  });

  // Handle client connections
  io.on('connection', (socket: UserSocket) => {
    console.log(`[chat] New connection: ${socket.id}`);

    // User authentication and setup
    socket.on('authenticate', async (data: {
      userId: number;
      token: string; // JWT or session token for verification
    }) => {
      try {
        // Verify the token (implementation depends on your auth system)
        // This is a placeholder; you should implement proper token verification
        const isValidToken = await verifyUserToken(data.userId, data.token, dbStorage);
        
        if (!isValidToken) {
          socket.emit('authentication_error', {
            message: 'Invalid authentication token'
          });
          return;
        }

        // Get user details from database
        const user = await dbStorage.getUserById(data.userId);
        if (!user) {
          socket.emit('authentication_error', {
            message: 'User not found'
          });
          return;
        }

        // Store user info in the socket object
        socket.userId = user.id;
        socket.userName = user.name;
        socket.userType = user.userType;

        // Map user ID to socket ID
        connectedUsers.set(user.id, socket.id);
        
        // Set user status to online
        userStatusMap.set(user.id, {
          status: 'online',
          lastActive: new Date(),
          customStatus: undefined
        });

        // Send authenticated event
        socket.emit('authenticated', {
          userId: user.id,
          userName: user.name,
          userType: user.userType
        });
        
        // Broadcast user status to relevant users
        broadcastUserStatus(user.id, 'online', io, dbStorage);

        console.log(`[chat] User authenticated: ${user.name} (${user.id})`);

        // Get user's conversations
        const conversations = await dbStorage.query(
          `SELECT c.*, 
              (SELECT COUNT(*) FROM chat_messages cm WHERE cm.conversation_id = c.id) as message_count,
              (SELECT MAX(cm2.sent_at) FROM chat_messages cm2 WHERE cm2.conversation_id = c.id) as last_message_time
           FROM chat_conversations c
           JOIN chat_participants cp ON c.id = cp.conversation_id
           WHERE cp.user_id = $1 AND cp.left_at IS NULL
           ORDER BY last_message_time DESC NULLS LAST`,
          [user.id]
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
            [conv.id, user.id]
          );

          return {
            ...conv,
            participants,
            lastMessage,
            unreadCount: unreadCount[0]?.count || 0
          };
        }));

        // Send conversations to user
        socket.emit('conversations_loaded', {
          conversations: formattedConversations
        });

        // Join socket rooms for all user's conversations
        for (const conv of conversations) {
          socket.join(`conversation:${conv.id}`);
        }
      } catch (error) {
        console.error('[chat] Authentication error:', error);
        socket.emit('authentication_error', {
          message: 'Authentication failed'
        });
      }
    });

    // Get messages for a conversation
    socket.on('get_messages', async (data: {
      conversationId: number;
      limit?: number;
      before?: Date; // For pagination
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { conversationId, limit = 30, before } = data;

        // Verify user is a participant in this conversation
        const isParticipant = await isConversationParticipant(
          conversationId,
          socket.userId,
          dbStorage
        );

        if (!isParticipant) {
          socket.emit('error', { 
            message: 'You are not a participant in this conversation' 
          });
          return;
        }

        // Get messages with pagination
        let query = `
          SELECT cm.*, u.name as sender_name, u.profile_image as sender_profile
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

        // Format and send messages
        socket.emit('messages_loaded', {
          conversationId,
          messages: messages.reverse(), // Send in chronological order
          hasMore: messages.length === limit
        });

        // Join the conversation room if not already joined
        socket.join(`conversation:${conversationId}`);

        // Mark messages as read
        await markMessagesAsRead(conversationId, socket.userId, dbStorage);

        // Update message cache
        if (messages.length > 0) {
          messageCache.set(conversationId, messages);
        }
      } catch (error) {
        console.error('[chat] Error loading messages:', error);
        socket.emit('error', { 
          message: 'Failed to load messages' 
        });
      }
    });

    // Send a new message
    socket.on('send_message', async (data: {
      conversationId: number;
      content?: string;
      mediaType?: string;
      mediaData?: string; // Base64 encoded media
      mediaName?: string;
      replyToId?: number;
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { 
          conversationId, 
          content,
          mediaType, 
          mediaData, 
          mediaName,
          replyToId 
        } = data;

        // Verify user is a participant in this conversation
        const isParticipant = await isConversationParticipant(
          conversationId,
          socket.userId,
          dbStorage
        );

        if (!isParticipant) {
          socket.emit('error', { 
            message: 'You are not a participant in this conversation' 
          });
          return;
        }

        // Check if user can send messages
        const canSend = await canSendMessages(
          conversationId,
          socket.userId,
          dbStorage
        );

        if (!canSend) {
          socket.emit('error', { 
            message: 'You do not have permission to send messages in this conversation' 
          });
          return;
        }

        // Validate message content
        if (!content && !mediaData) {
          socket.emit('error', { 
            message: 'Message cannot be empty' 
          });
          return;
        }

        // Temporary message ID for optimistic UI updates
        const tempId = uuidv4();
        
        // Process media if present
        let messageType = 'text';
        let mediaUrl = null;
        let mediaThumbnailUrl = null;
        let mediaSize = null;
        let mediaDuration = null;
        let mediaWidth = null;
        let mediaHeight = null;
        
        if (mediaData && mediaType) {
          // Determine media type
          if (imageTypes.some(type => mediaType.includes(type))) {
            messageType = 'image';
          } else if (videoTypes.some(type => mediaType.includes(type))) {
            messageType = 'video';
          } else if (audioTypes.some(type => mediaType.includes(type))) {
            messageType = 'audio';
          } else if (documentTypes.some(type => mediaType.includes(type))) {
            messageType = 'document';
          } else {
            socket.emit('error', { 
              message: 'Unsupported media type' 
            });
            return;
          }

          // Save media file
          const { 
            url, 
            thumbnailUrl, 
            size, 
            width, 
            height, 
            duration 
          } = await saveMediaFile(
            mediaData, 
            mediaType, 
            mediaName || 'untitled', 
            messageType
          );

          mediaUrl = url;
          mediaThumbnailUrl = thumbnailUrl;
          mediaSize = size;
          mediaWidth = width;
          mediaHeight = height;
          mediaDuration = duration;
        }

        // Perform AI content moderation if enabled
        const conversation = await dbStorage.query(
          `SELECT * FROM chat_conversations WHERE id = $1`,
          [conversationId]
        );
        
        const moderationEnabled = conversation[0]?.moderationEnabled;
        const aiScanEnabled = conversation[0]?.aiScanEnabled;
        
        let securityStatus = 'pending';
        let securityDetails = null;

        if (moderationEnabled && content) {
          // Perform text moderation
          const moderationResult = await moderateContent(content, aiService);
          if (!moderationResult.safe) {
            securityStatus = 'flagged';
            securityDetails = moderationResult;
            
            // If high risk, block the message
            if (moderationResult.highRisk) {
              securityStatus = 'blocked';
              socket.emit('message_blocked', {
                tempId,
                reason: 'Content violates community guidelines',
                details: moderationResult.details
              });
              return;
            }
          } else {
            securityStatus = 'passed';
          }
        }

        // Create the message in database
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
            security_details,
            sent_at,
            created_at,
            updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW(), NOW()
          ) RETURNING *`,
          [
            conversationId,
            socket.userId,
            replyToId || null,
            messageType,
            content || null,
            mediaUrl,
            mediaThumbnailUrl,
            mediaType,
            mediaSize,
            mediaWidth,
            mediaHeight,
            mediaDuration,
            mediaName,
            securityStatus,
            securityDetails ? JSON.stringify(securityDetails) : null
          ]
        );

        // Get sender info for message
        const sender = await dbStorage.query(
          `SELECT id, name, profile_image FROM users WHERE id = $1`,
          [socket.userId]
        );

        // Format complete message
        const formattedMessage = {
          ...newMessage[0],
          sender_name: sender[0].name,
          sender_profile: sender[0].profile_image,
          tempId
        };

        // Broadcast message to all participants in the conversation
        io.to(`conversation:${conversationId}`).emit('new_message', formattedMessage);

        // Add message to cache
        addMessageToCache(conversationId, formattedMessage);

        // Mark message as read by the sender
        await markMessagesAsRead(conversationId, socket.userId, dbStorage);

        // Update conversation last_message_at
        await dbStorage.query(
          `UPDATE chat_conversations 
           SET last_message_at = NOW(), updated_at = NOW() 
           WHERE id = $1`,
          [conversationId]
        );

        // Send push notifications to offline participants
        await sendPushNotifications(
          conversationId, 
          socket.userId, 
          formattedMessage, 
          connectedUsers,
          dbStorage
        );

        // Schedule media scan if needed and enabled
        if (aiScanEnabled && (mediaUrl || mediaThumbnailUrl)) {
          scheduleMediaScan(newMessage[0].id, mediaUrl, mediaType, aiService);
        }
      } catch (error) {
        console.error('[chat] Error sending message:', error);
        socket.emit('error', { 
          message: 'Failed to send message' 
        });
      }
    });

    // Create a new conversation
    socket.on('create_conversation', async (data: {
      title?: string;
      type: 'direct' | 'group';
      participants: number[]; // User IDs
      isPublic?: boolean;
      isEncrypted?: boolean;
      description?: string;
      avatar?: string;
    }) => {
      try {
        if (!socket.userId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const { 
          title, 
          type, 
          participants, 
          isPublic = false,
          isEncrypted = true,
          description,
          avatar
        } = data;

        // Validate participants
        if (!participants || participants.length === 0) {
          socket.emit('error', { message: 'No participants specified' });
          return;
        }

        // For direct messages, only allow 2 participants
        if (type === 'direct' && participants.length !== 1) {
          socket.emit('error', { 
            message: 'Direct conversations must have exactly one recipient' 
          });
          return;
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
            [socket.userId, participants[0]]
          );

          if (existingConversation.length > 0) {
            const conversationId = existingConversation[0].id;
            
            // Get full conversation details
            const conversation = await getFormattedConversation(
              conversationId, 
              socket.userId,
              dbStorage
            );

            socket.emit('conversation_created', conversation);
            return;
          }
        }

        // Create the new conversation
        const allParticipants = [socket.userId, ...participants];
        
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
            socket.userId,
            isPublic,
            isEncrypted,
            description || null,
            avatar || null
          ]
        );

        const conversationId = newConversation[0].id;

        // Add participants
        for (const userId of allParticipants) {
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
              userId,
              userId === socket.userId ? 'admin' : 'member',
              userId === socket.userId, // Only creator can add participants
              userId === socket.userId, // Only creator can remove participants
              userId === socket.userId  // Only creator can edit settings
            ]
          );
        }

        // Add system message about conversation creation
        const systemMessage = await dbStorage.query(
          `INSERT INTO chat_messages (
            conversation_id,
            sender_id,
            type,
            content,
            security_status,
            sent_at,
            created_at,
            updated_at
          ) VALUES ($1, $2, 'system', $3, 'passed', NOW(), NOW(), NOW())
          RETURNING *`,
          [
            conversationId,
            socket.userId,
            type === 'direct' 
              ? 'Conversation started' 
              : `Group "${title || 'Untitled'}" created by ${socket.userName}`
          ]
        );

        // Get formatted conversation with participants
        const formattedConversation = await getFormattedConversation(
          conversationId,
          socket.userId,
          dbStorage
        );

        // Join socket to the conversation room
        socket.join(`conversation:${conversationId}`);

        // Emit the new conversation to all participants who are online
        for (const userId of allParticipants) {
          const participantSocketId = connectedUsers.get(userId);
          if (participantSocketId) {
            const participantSocket = io.sockets.sockets.get(participantSocketId) as UserSocket;
            if (participantSocket) {
              participantSocket.join(`conversation:${conversationId}`);
              participantSocket.emit('conversation_created', formattedConversation);
            }
          }
        }
      } catch (error) {
        console.error('[chat] Error creating conversation:', error);
        socket.emit('error', { 
          message: 'Failed to create conversation' 
        });
      }
    });

    // User starts typing
    socket.on('typing_start', (data: { conversationId: number }) => {
      if (!socket.userId) return;

      const { conversationId } = data;
      
      // Update typing status
      let conversationTyping = typingUsers.get(conversationId);
      if (!conversationTyping) {
        conversationTyping = new Map<number, number>();
        typingUsers.set(conversationId, conversationTyping);
      }

      conversationTyping.set(socket.userId, Date.now());

      // Broadcast typing status
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.userId,
        userName: socket.userName
      });
    });

    // User stops typing
    socket.on('typing_stop', (data: { conversationId: number }) => {
      if (!socket.userId) return;

      const { conversationId } = data;
      
      // Update typing status
      const conversationTyping = typingUsers.get(conversationId);
      if (conversationTyping) {
        conversationTyping.delete(socket.userId);
      }

      // Broadcast typing stopped
      socket.to(`conversation:${conversationId}`).emit('user_typing_stopped', {
        conversationId,
        userId: socket.userId
      });
    });

    // Mark messages as read
    socket.on('mark_read', async (data: { conversationId: number }) => {
      if (!socket.userId) return;

      const { conversationId } = data;
      
      try {
        await markMessagesAsRead(conversationId, socket.userId, dbStorage);
        
        // Notify other participants about read status
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId: socket.userId,
          readAt: new Date()
        });
      } catch (error) {
        console.error('[chat] Error marking messages as read:', error);
      }
    });

    // Delete a message (for the sender only)
    socket.on('delete_message', async (data: { messageId: number }) => {
      if (!socket.userId) return;

      const { messageId } = data;
      
      try {
        // Get message details
        const message = await dbStorage.query(
          `SELECT * FROM chat_messages WHERE id = $1`,
          [messageId]
        );

        if (message.length === 0) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const msg = message[0];

        // Only allow sender to delete their own messages
        if (msg.sender_id !== socket.userId) {
          socket.emit('error', { message: 'You can only delete your own messages' });
          return;
        }

        // Update message status to deleted
        await dbStorage.query(
          `UPDATE chat_messages SET status = 'deleted', updated_at = NOW() WHERE id = $1`,
          [messageId]
        );

        // Notify all participants
        io.to(`conversation:${msg.conversation_id}`).emit('message_deleted', {
          messageId,
          conversationId: msg.conversation_id,
          deletedBy: socket.userId
        });

        // Update cache
        updateCachedMessageStatus(msg.conversation_id, messageId, 'deleted');
      } catch (error) {
        console.error('[chat] Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Add reaction to a message
    socket.on('add_reaction', async (data: { 
      messageId: number,
      reaction: string
    }) => {
      if (!socket.userId) return;

      const { messageId, reaction } = data;
      
      try {
        // Get message details
        const message = await dbStorage.query(
          `SELECT * FROM chat_messages WHERE id = $1`,
          [messageId]
        );

        if (message.length === 0) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const msg = message[0];

        // Check if reaction already exists
        const existingReaction = await dbStorage.query(
          `SELECT * FROM chat_message_reactions 
           WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
          [messageId, socket.userId, reaction]
        );

        if (existingReaction.length > 0) {
          // Reaction already exists, no need to add it again
          return;
        }

        // Add reaction
        const newReaction = await dbStorage.query(
          `INSERT INTO chat_message_reactions (
            message_id, user_id, reaction, created_at
          ) VALUES ($1, $2, $3, NOW()) RETURNING *`,
          [messageId, socket.userId, reaction]
        );

        // Notify all participants
        io.to(`conversation:${msg.conversation_id}`).emit('message_reaction_added', {
          messageId,
          conversationId: msg.conversation_id,
          reaction: newReaction[0]
        });
      } catch (error) {
        console.error('[chat] Error adding reaction:', error);
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Remove reaction from a message
    socket.on('remove_reaction', async (data: { 
      messageId: number,
      reaction: string
    }) => {
      if (!socket.userId) return;

      const { messageId, reaction } = data;
      
      try {
        // Get message details
        const message = await dbStorage.query(
          `SELECT * FROM chat_messages WHERE id = $1`,
          [messageId]
        );

        if (message.length === 0) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const msg = message[0];

        // Remove reaction
        await dbStorage.query(
          `DELETE FROM chat_message_reactions 
           WHERE message_id = $1 AND user_id = $2 AND reaction = $3`,
          [messageId, socket.userId, reaction]
        );

        // Notify all participants
        io.to(`conversation:${msg.conversation_id}`).emit('message_reaction_removed', {
          messageId,
          conversationId: msg.conversation_id,
          userId: socket.userId,
          reaction
        });
      } catch (error) {
        console.error('[chat] Error removing reaction:', error);
        socket.emit('error', { message: 'Failed to remove reaction' });
      }
    });

    // Leave a group conversation
    socket.on('leave_conversation', async (data: { conversationId: number }) => {
      if (!socket.userId) return;

      const { conversationId } = data;
      
      try {
        // Get conversation details
        const conversation = await dbStorage.query(
          `SELECT * FROM chat_conversations WHERE id = $1`,
          [conversationId]
        );

        if (conversation.length === 0) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        const conv = conversation[0];

        // Can't leave direct conversations
        if (conv.type === 'direct') {
          socket.emit('error', { message: 'Cannot leave direct conversations' });
          return;
        }

        // Update participant record
        await dbStorage.query(
          `UPDATE chat_participants 
           SET left_at = NOW() 
           WHERE conversation_id = $1 AND user_id = $2`,
          [conversationId, socket.userId]
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
            socket.userId,
            `${socket.userName} left the group`
          ]
        );

        // Leave the socket room
        socket.leave(`conversation:${conversationId}`);

        // Notify user they've left successfully
        socket.emit('left_conversation', { conversationId });

        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('user_left_conversation', {
          conversationId,
          userId: socket.userId,
          userName: socket.userName
        });
      } catch (error) {
        console.error('[chat] Error leaving conversation:', error);
        socket.emit('error', { message: 'Failed to leave conversation' });
      }
    });
    
    // User is setting their status manually
    socket.on('set_user_status', (data: { 
      status: 'online' | 'away' | 'busy' | 'offline';
      customStatus?: string;
    }) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const { status, customStatus } = data;
      
      // Set user status
      userStatusMap.set(socket.userId, {
        status,
        lastActive: new Date(),
        customStatus
      });
      
      // Broadcast status change
      broadcastUserStatus(socket.userId, status, io, dbStorage);
      
      socket.emit('status_updated', {
        status,
        customStatus
      });
      
      console.log(`[chat] User ${socket.userId} manually set status to: ${status}`);
    });
    
    // Get the status of specific users
    socket.on('get_users_status', async (data: { userIds: number[] }) => {
      if (!socket.userId) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      const { userIds } = data;
      const statusResponse: any[] = [];
      
      // Get status for each requested user
      for (const userId of userIds) {
        let userStatus = userStatusMap.get(userId);
        
        // If not found in the map, default to offline
        if (!userStatus) {
          userStatus = {
            status: 'offline',
            lastActive: new Date()
          };
        }
        
        // Get user details
        const userDetails = await dbStorage.query(
          `SELECT id, name, profile_image FROM users WHERE id = $1`,
          [userId]
        );
        
        if (userDetails.length > 0) {
          statusResponse.push({
            userId,
            status: userStatus.status,
            lastActive: userStatus.lastActive,
            customStatus: userStatus.customStatus,
            name: userDetails[0].name,
            profileImage: userDetails[0].profile_image
          });
        }
      }
      
      // Send back statuses
      socket.emit('users_status', {
        statuses: statusResponse
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[chat] User disconnected: ${socket.id}`);
      
      if (socket.userId) {
        // Remove from connected users map
        connectedUsers.delete(socket.userId);
        
        // Update user status to offline
        userStatusMap.set(socket.userId, {
          status: 'offline',
          lastActive: new Date()
        });
        
        // Broadcast status change
        broadcastUserStatus(socket.userId, 'offline', io, dbStorage);
        
        // Clear typing status in all conversations
        for (const [conversationId, users] of typingUsers.entries()) {
          if (users.has(socket.userId)) {
            users.delete(socket.userId);
            
            // Notify others that user stopped typing
            socket.to(`conversation:${conversationId}`).emit('user_typing_stopped', {
              conversationId,
              userId: socket.userId
            });
          }
        }
      }
    });
  });

  // Set up periodic cleanup for typing indicators
  setInterval(() => {
    const now = Date.now();
    const TYPING_TIMEOUT = 5000; // 5 seconds
    
    for (const [conversationId, users] of typingUsers.entries()) {
      for (const [userId, timestamp] of users.entries()) {
        if (now - timestamp > TYPING_TIMEOUT) {
          // Remove expired typing indicator
          users.delete(userId);
          
          // Notify participants that user stopped typing
          const userSocketId = connectedUsers.get(userId);
          if (userSocketId) {
            io.to(`conversation:${conversationId}`).emit('user_typing_stopped', {
              conversationId,
              userId
            });
          }
        }
      }
    }
  }, 1000);

  console.log('[chat] Chat server initialized');
  return io;
}

/**
 * Verify a user's authentication token
 * This is a placeholder - implement actual token verification
 */
async function verifyUserToken(
  userId: number, 
  token: string,
  dbStorage: Storage
): Promise<boolean> {
  try {
    // In a real implementation, verify JWT or session token
    // For now, just check if the user exists
    const user = await dbStorage.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );
    
    return user.length > 0;
  } catch (error) {
    console.error('[chat] Token verification error:', error);
    return false;
  }
}

/**
 * Check if a user is a participant in a conversation
 */
async function isConversationParticipant(
  conversationId: number,
  userId: number,
  dbStorage: Storage
): Promise<boolean> {
  try {
    const participant = await dbStorage.query(
      `SELECT * FROM chat_participants 
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );
    
    return participant.length > 0;
  } catch (error) {
    console.error('[chat] Error checking participant:', error);
    return false;
  }
}

/**
 * Check if a user can send messages in a conversation
 */
async function canSendMessages(
  conversationId: number,
  userId: number,
  dbStorage: Storage
): Promise<boolean> {
  try {
    const participant = await dbStorage.query(
      `SELECT can_send_messages FROM chat_participants 
       WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL`,
      [conversationId, userId]
    );
    
    return participant.length > 0 && participant[0].can_send_messages;
  } catch (error) {
    console.error('[chat] Error checking send permission:', error);
    return false;
  }
}

/**
 * Save a media file from base64 data
 */
async function saveMediaFile(
  base64Data: string,
  mimeType: string,
  fileName: string,
  mediaType: string
): Promise<{
  url: string;
  thumbnailUrl?: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
}> {
  try {
    // Determine file extension from MIME type
    let extension = '';
    if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
      extension = '.jpg';
    } else if (mimeType.includes('png')) {
      extension = '.png';
    } else if (mimeType.includes('gif')) {
      extension = '.gif';
    } else if (mimeType.includes('webp')) {
      extension = '.webp';
    } else if (mimeType.includes('mp4')) {
      extension = '.mp4';
    } else if (mimeType.includes('webm')) {
      extension = '.webm';
    } else if (mimeType.includes('mp3')) {
      extension = '.mp3';
    } else if (mimeType.includes('wav')) {
      extension = '.wav';
    } else if (mimeType.includes('pdf')) {
      extension = '.pdf';
    } else if (mimeType.includes('msword')) {
      extension = '.doc';
    } else if (mimeType.includes('wordprocessingml')) {
      extension = '.docx';
    } else if (mimeType.includes('text/plain')) {
      extension = '.txt';
    } else if (mimeType.includes('spreadsheetml')) {
      extension = '.xlsx';
    } else {
      extension = '.bin';
    }

    // Clean up filename and add extension
    const sanitizedName = fileName
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    const uniqueName = `${Date.now()}-${sanitizedName}${extension}`;
    
    // Determine subdirectory based on media type
    let subdir = '';
    if (mediaType === 'image') {
      subdir = 'images';
    } else if (mediaType === 'video') {
      subdir = 'videos';
    } else if (mediaType === 'audio') {
      subdir = 'audio';
    } else {
      subdir = 'documents';
    }
    
    // Process base64 data
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 data');
    }
    
    const imageData = Buffer.from(matches[2], 'base64');
    const filePath = join(CHAT_UPLOADS_DIR, subdir, uniqueName);
    
    // Save file
    await promisify(fs.writeFile)(filePath, imageData);
    
    // Get file size
    const stats = await promisify(fs.stat)(filePath);
    const size = stats.size;
    
    // Generate thumbnail and get dimensions for images
    let thumbnailUrl = undefined;
    let width = undefined;
    let height = undefined;
    let duration = undefined;
    
    if (mediaType === 'image') {
      // Process image and create thumbnail
      const thumbnailName = `thumb-${uniqueName}`;
      const thumbnailPath = join(CHAT_UPLOADS_DIR, subdir, thumbnailName);
      
      // Get image dimensions
      const metadata = await sharp(filePath).metadata();
      width = metadata.width;
      height = metadata.height;
      
      // Create thumbnail
      await sharp(filePath)
        .resize({ width: 300, height: 300, fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      thumbnailUrl = `/uploads/chat/${subdir}/${thumbnailName}`;
    }
    
    // Return file information
    return {
      url: `/uploads/chat/${subdir}/${uniqueName}`,
      thumbnailUrl,
      size,
      width,
      height,
      duration
    };
  } catch (error) {
    console.error('[chat] Error saving media file:', error);
    throw error;
  }
}

/**
 * Moderate content using AI
 */
async function moderateContent(
  content: string,
  aiService: CustomAIService
): Promise<{
  safe: boolean;
  highRisk: boolean;
  details?: {
    category: string;
    confidence: number;
  }[];
}> {
  try {
    // Use AI manager to moderate content
    const moderationResult = await executeAIOperation('moderation', {
      text: content,
      threshold: 0.7
    });

    if (moderationResult.error) {
      console.error('[chat] Moderation error:', moderationResult.error);
      // Default to safe if moderation fails
      return { safe: true, highRisk: false };
    }

    const { flagged, categories, scores } = moderationResult.result;
    
    if (!flagged) {
      return { safe: true, highRisk: false };
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
      detail => highRiskCategories.includes(detail.category) && detail.confidence > 0.85
    );

    return {
      safe: false,
      highRisk,
      details
    };
  } catch (error) {
    console.error('[chat] Content moderation error:', error);
    // Default to safe if error occurs
    return { safe: true, highRisk: false };
  }
}

/**
 * Schedule a media scan for security
 */
async function scheduleMediaScan(
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
        console.error('[chat] Media scan error:', scanResult.error);
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
      console.error('[chat] Error in media scan:', error);
    }
  }, 500);
}

/**
 * Mark all unread messages as read by a user
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
    console.error('[chat] Error marking messages as read:', error);
    throw error;
  }
}

/**
 * Send push notifications to offline participants
 */
async function sendPushNotifications(
  conversationId: number,
  senderId: number,
  message: any,
  connectedUsers: Map<number, string>,
  dbStorage: Storage
): Promise<void> {
  try {
    // Get all participants in the conversation
    const participants = await dbStorage.query(
      `SELECT cp.user_id FROM chat_participants cp
       WHERE cp.conversation_id = $1 
       AND cp.user_id != $2
       AND cp.left_at IS NULL`,
      [conversationId, senderId]
    );
    
    // Filter out online users
    const offlineParticipants = participants
      .filter(p => !connectedUsers.has(p.user_id))
      .map(p => p.user_id);
    
    if (offlineParticipants.length === 0) return;
    
    // Get conversation details
    const conversation = await dbStorage.query(
      `SELECT * FROM chat_conversations WHERE id = $1`,
      [conversationId]
    );
    
    if (conversation.length === 0) return;
    
    const conv = conversation[0];
    
    // Get sender details
    const sender = await dbStorage.query(
      `SELECT name FROM users WHERE id = $1`,
      [senderId]
    );
    
    if (sender.length === 0) return;
    
    // Create notification text
    let notificationText = '';
    if (message.type === 'text') {
      notificationText = message.content;
    } else if (message.type === 'image') {
      notificationText = '📷 Image';
    } else if (message.type === 'video') {
      notificationText = '🎥 Video';
    } else if (message.type === 'audio') {
      notificationText = '🎵 Audio message';
    } else if (message.type === 'document') {
      notificationText = '📄 Document';
    }
    
    // Send notifications (in a real implementation, this would use a push notification service)
    // This is just a placeholder
    console.log('[chat] Would send push notifications to:', offlineParticipants);
    console.log(`[chat] Notification: New message from ${sender[0].name} in ${conv.title || 'Chat'}: ${notificationText}`);
  } catch (error) {
    console.error('[chat] Error sending push notifications:', error);
  }
}

/**
 * Add a message to the cache
 */
function addMessageToCache(conversationId: number, message: any): void {
  let messages = messageCache.get(conversationId) || [];
  
  // Add new message
  messages.push(message);
  
  // Trim cache if too large
  if (messages.length > MESSAGE_CACHE_SIZE) {
    messages = messages.slice(-MESSAGE_CACHE_SIZE);
  }
  
  messageCache.set(conversationId, messages);
}

/**
 * Update a cached message's status
 */
function updateCachedMessageStatus(
  conversationId: number,
  messageId: number,
  status: string
): void {
  const messages = messageCache.get(conversationId);
  if (!messages) return;
  
  const messageIndex = messages.findIndex(m => m.id === messageId);
  if (messageIndex === -1) return;
  
  messages[messageIndex].status = status;
  messageCache.set(conversationId, messages);
}

/**
 * Broadcast a user's status change to all relevant users
 * This function notifies all users who have a conversation with the status-changed user
 */
async function broadcastUserStatus(
  userId: number, 
  status: 'online' | 'away' | 'busy' | 'offline',
  io: Server,
  dbStorage: Storage
) {
  try {
    // Get all conversation participants who interact with this user
    const relatedUsers = await dbStorage.query(
      `SELECT DISTINCT cp2.user_id 
       FROM chat_participants cp1
       JOIN chat_participants cp2 ON cp1.conversation_id = cp2.conversation_id 
       WHERE cp1.user_id = $1 
       AND cp2.user_id != $1
       AND cp1.left_at IS NULL
       AND cp2.left_at IS NULL`,
      [userId]
    );
    
    // Get user details
    const userDetails = await dbStorage.query(
      `SELECT id, name, profile_image FROM users WHERE id = $1`,
      [userId]
    );
    
    if (userDetails.length === 0) return;
    
    const statusInfo = {
      userId,
      status,
      lastActive: userStatusMap.get(userId)?.lastActive || new Date(),
      customStatus: userStatusMap.get(userId)?.customStatus,
      name: userDetails[0].name,
      profileImage: userDetails[0].profile_image
    };
    
    // Broadcast status to all related users who are connected
    for (const user of relatedUsers) {
      const socketId = connectedUsers.get(user.user_id);
      if (socketId) {
        io.to(socketId).emit('user_status_update', statusInfo);
      }
    }
    
    // Also broadcast to any rooms where this user is a member
    const userConversations = await dbStorage.query(
      `SELECT conversation_id FROM chat_participants 
       WHERE user_id = $1 AND left_at IS NULL`,
      [userId]
    );
    
    for (const conv of userConversations) {
      io.to(`conversation:${conv.conversation_id}`).emit('conversation_user_status_update', statusInfo);
    }
    
    console.log(`[chat] User ${userId} status broadcast to ${relatedUsers.length} users: ${status}`);
  } catch (error) {
    console.error('[chat] Error broadcasting user status:', error);
  }
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
    console.error('[chat] Error formatting conversation:', error);
    throw error;
  }
}