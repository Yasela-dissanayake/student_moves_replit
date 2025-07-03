# Student Chat System

## Overview

The Student Chat System is a WhatsApp-style secure messaging platform designed specifically for university students. It features end-to-end encryption, AI-powered security scanning, and a comprehensive notification system to keep students connected while ensuring their communications remain private and secure.

## Key Features

### 1. Secure Messaging

- **End-to-End Encryption:** All messages are encrypted during transmission and storage
- **AI Security Scanning:** Automated content scanning to detect and flag harmful content
- **Security Status Indicators:** Visual indicators showing message security status (pending, passed, flagged)
- **Security Information Dashboard:** Detailed information about security measures for new conversations

### 2. User-Friendly Interface

- **WhatsApp-Style Design:** Familiar messaging interface with green color scheme
- **Message Status Indicators:** Sent, delivered, and read receipts
- **Typing Indicators:** Shows when someone is composing a message
- **Multimedia Support:** Share images, videos, documents, and audio files

### 3. Friend Connection System

- **QR Code Sharing:** Connect with friends by scanning QR codes
- **Email Invitations:** Send personalized invitation emails to friends
- **WhatsApp Sharing Integration:** Share invitation links via WhatsApp
- **Clipboard Sharing:** Easy copy-paste of invitation links

### 4. Preview Mode

- **Non-Registered View:** View-only mode for non-registered users
- **Security Indicators:** Preview of security features to encourage sign-up
- **Animated New Message Indicators:** Visual cues for unread messages
- **Community Statistics:** Shows active user counts and message volumes

### 5. Notification System

- **Email Notifications:** Receive notifications about new messages via email
- **Customizable Preferences:** Control which notifications you receive
- **Weekly Digests:** Summarized weekly activity reports
- **Welcome Emails:** Onboarding emails for new users

### 6. Admin Controls

- **Security Monitoring:** Dashboard for tracking security alerts
- **User Management:** Add, remove, or block users
- **Group Management:** Create and moderate group conversations
- **Analytics:** Track usage patterns and security metrics

## Technical Components

### Frontend Components

- `FriendsChatInterface.tsx`: Main chat interface with security indicators
- `FriendInviteShare.tsx`: Component for inviting friends via various channels
- `AdminChatNotifications.tsx`: Notification system for admins
- Various UI components for messages, conversations, and security indicators

### Backend Services

- `chat-email-service.ts`: Handles email notifications via SendGrid
- `chat-welcome-service.ts`: Manages onboarding for new users
- `chat-service-integration.ts`: Integration points for other system components

### Security Documentation

Detailed security information can be found in [CHAT_SECURITY.md](./CHAT_SECURITY.md)

## Getting Started

1. Navigate to the student chat interface at `/student/chat`
2. For non-registered users, preview content is available
3. Register or log in to send messages
4. Use the invite tools to connect with friends

## Development

### Adding New Features

When adding new features to the chat system:

1. Maintain the WhatsApp-style design language
2. Ensure all new message types support security scanning
3. Add appropriate security indicators for any new functionality
4. Update documentation as needed

### Security Considerations

All new components should:

1. Respect end-to-end encryption guidelines
2. Include appropriate security indicators
3. Support the AI security scanning system
4. Maintain user privacy

## Conclusion

The Student Chat System provides a secure, user-friendly messaging experience for university students. Its combination of strong security features and familiar WhatsApp-style interface makes it easy for students to stay connected while ensuring their communications remain private and protected.