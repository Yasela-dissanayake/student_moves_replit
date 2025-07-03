# Social Media Service Documentation

## Overview

The Social Media Service provides functionality to post content to various social media platforms with intelligent rate limiting. The service ensures users don't exceed platform-specific posting limits while providing clear feedback about platform availability.

## API Endpoints

### Get Rate Limits

```
GET /api/targeting/social/limits
```

Returns rate limit information for all platforms or specific platforms if provided.

**Query Parameters:**
- `platforms` (optional): Comma-separated list of platform names to check

**Response Structure:**
```json
{
  "success": true,
  "limits": {
    "platform1": {
      "supported": true,
      "totalLimit": 25,
      "usedToday": 5,
      "remainingPosts": 20,
      "nextBestTime": "Now"
    },
    "platform2": {
      "supported": false,
      "error": "Platform not supported",
      "remainingPosts": 0,
      "nextBestTime": "N/A"
    }
  }
}
```

### Post to Social Media

```
POST /api/targeting/social/post
```

Posts content to a specific social media platform.

**Request Body:**
```json
{
  "platform": "facebook",
  "content": "Your post content here",
  "campaignId": 123 // optional
}
```

**Response Structure:**
```json
{
  "success": true,
  "message": "Successfully posted to facebook",
  "postId": 45
}
```

Or, if failed:

```json
{
  "success": false,
  "message": "Rate limit exceeded for instagram. Next best time to post: Today at 3:00 PM"
}
```

### Get Post History

```
GET /api/targeting/social/history
```

Returns posting history for the authenticated user.

**Query Parameters:**
- `platform` (optional): Filter history by platform name

**Response Structure:**
```json
{
  "success": true,
  "history": [
    {
      "id": 123,
      "platform": "facebook",
      "content": "Post content here",
      "status": "success",
      "createdAt": "2025-04-13T12:30:45.123Z"
    },
    {
      "id": 122,
      "platform": "twitter",
      "content": "Another post",
      "status": "failed",
      "createdAt": "2025-04-13T12:15:22.456Z"
    }
  ]
}
```

## Platform Support Status

The Social Media Service provides clear information about which platforms are supported through the `supported` flag in the rate limits response. This helps client applications make appropriate UI decisions.

### Supported Platform Response

For supported platforms, the response includes:

```json
{
  "supported": true,
  "totalLimit": 25,
  "usedToday": 5,
  "remainingPosts": 20,
  "nextBestTime": "Now"
}
```

### Unsupported Platform Response

For unsupported platforms, the response includes:

```json
{
  "supported": false,
  "error": "Platform not supported",
  "remainingPosts": 0,
  "nextBestTime": "N/A"
}
```

## Rate Limit Details

The service enforces the following daily post limits per platform:

| Platform  | Daily Limit |
|-----------|-------------|
| Instagram | 5           |
| Facebook  | 25          |
| Twitter   | 50          |
| LinkedIn  | 3           |
| YouTube   | 2           |
| TikTok    | 8           |

When a user reaches their limit for a platform, the service will provide the next recommended posting time based on optimal engagement times for that platform.

## Client Implementation

Client-side applications should use the `supported` flag to determine whether to enable posting to a specific platform and whether to display rate limit information. The discriminated union pattern in TypeScript can be used to handle these different states:

```typescript
interface SupportedRateLimit {
  supported: true;
  totalLimit: number;
  usedToday: number;
  remainingPosts: number;
  nextBestTime: string;
}

interface UnsupportedPlatform {
  supported: false;
  error: string;
  remainingPosts: number;
  nextBestTime: string;
}

type RateLimitData = SupportedRateLimit | UnsupportedPlatform;
```

This allows client code to safely discriminate between the two states:

```typescript
if (rateLimitData.supported) {
  // It's a supported platform, can access totalLimit, usedToday, etc.
  showRateLimitProgress(rateLimitData.usedToday, rateLimitData.totalLimit);
} else {
  // It's an unsupported platform, can access error message
  showError(rateLimitData.error);
}
```