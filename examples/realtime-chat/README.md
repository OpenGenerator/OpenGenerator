# Realtime Chat Example

A real-time chat application demonstrating GraphQL subscriptions with WebSockets.

## Features

- Real-time messaging with GraphQL subscriptions
- Direct messages and group chats
- Typing indicators
- User presence/online status
- Message reactions (emoji)
- File attachments
- Message replies/threads
- Read receipts

## Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your database and Redis URLs

# Push database schema
pnpm db:push

# Generate API code
pnpm generate

# Start development server
pnpm dev
```

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Web Client    │◄────────│  GraphQL Yoga   │
│  (WebSocket)    │         │   (HTTP/WS)     │
└─────────────────┘         └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │     Redis       │
                            │   (PubSub)      │
                            └────────┬────────┘
                                     │
                            ┌────────▼────────┐
                            │   PostgreSQL    │
                            │   (Database)    │
                            └─────────────────┘
```

## GraphQL Operations

### Queries
```graphql
query GetRooms {
  rooms {
    id
    name
    type
    lastMessage {
      content
      createdAt
    }
    unreadCount
  }
}

query GetMessages($roomId: ID!) {
  messages(roomId: $roomId, limit: 50) {
    edges {
      node {
        id
        content
        sender {
          username
          avatarUrl
        }
        createdAt
      }
    }
  }
}
```

### Mutations
```graphql
mutation SendMessage($roomId: ID!, $content: String!) {
  sendMessage(roomId: $roomId, content: $content) {
    id
    content
    createdAt
  }
}
```

### Subscriptions
```graphql
subscription OnNewMessage($roomId: ID!) {
  messageCreated(roomId: $roomId) {
    id
    content
    sender {
      username
      avatarUrl
    }
    createdAt
  }
}

subscription OnTyping($roomId: ID!) {
  typingIndicator(roomId: $roomId) {
    userId
    isTyping
  }
}
```

## Redis PubSub Events

| Event | Payload |
|-------|---------|
| `message:created` | `{ roomId, message }` |
| `message:updated` | `{ roomId, message }` |
| `message:deleted` | `{ roomId, messageId }` |
| `user:status` | `{ userId, status }` |
| `typing:start` | `{ roomId, userId }` |
| `typing:stop` | `{ roomId, userId }` |

## Learn More

- [GraphQL Subscriptions Guide](https://opengenerator.dev/guides/subscriptions)
- [graphql-yoga Documentation](https://the-guild.dev/graphql/yoga-server)
- [graphql-ws Documentation](https://github.com/enisdenjo/graphql-ws)
