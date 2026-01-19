/**
 * Realtime Chat Example
 * Demonstrates GraphQL subscriptions with WebSockets
 */

import { createServer } from 'node:http'
import { createYoga, createPubSub } from 'graphql-yoga'
import { useServer } from 'graphql-ws/lib/use/ws'
import { WebSocketServer } from 'ws'

// Create PubSub for subscriptions
const pubsub = createPubSub<{
  'message:created': [roomId: string, message: Message]
  'message:updated': [roomId: string, message: Message]
  'message:deleted': [roomId: string, messageId: string]
  'user:status': [userId: string, status: string]
  'typing:start': [roomId: string, userId: string]
  'typing:stop': [roomId: string, userId: string]
}>()

// GraphQL Schema (simplified - generate with OpenGenerator)
const typeDefs = /* GraphQL */ `
  type Query {
    me: User
    room(id: ID!): Room
    rooms: [Room!]!
    messages(roomId: ID!, limit: Int, before: String): MessageConnection!
  }

  type Mutation {
    sendMessage(roomId: ID!, content: String!, type: MessageType): Message!
    editMessage(id: ID!, content: String!): Message!
    deleteMessage(id: ID!): Boolean!
    addReaction(messageId: ID!, emoji: String!): Reaction!
    removeReaction(messageId: ID!, emoji: String!): Boolean!
    createRoom(name: String, memberIds: [ID!]!): Room!
    updateStatus(status: UserStatus!): User!
    startTyping(roomId: ID!): Boolean!
    stopTyping(roomId: ID!): Boolean!
  }

  type Subscription {
    messageCreated(roomId: ID!): Message!
    messageUpdated(roomId: ID!): Message!
    messageDeleted(roomId: ID!): ID!
    userStatusChanged(userId: ID): UserStatusEvent!
    typingIndicator(roomId: ID!): TypingEvent!
  }

  type User {
    id: ID!
    username: String!
    displayName: String
    avatarUrl: String
    status: UserStatus!
    lastSeenAt: DateTime
  }

  type Room {
    id: ID!
    name: String
    type: RoomType!
    members: [RoomMember!]!
    lastMessage: Message
    unreadCount: Int!
  }

  type RoomMember {
    id: ID!
    user: User!
    role: RoomRole!
    lastReadAt: DateTime
  }

  type Message {
    id: ID!
    content: String!
    type: MessageType!
    sender: User!
    room: Room!
    replyTo: Message
    reactions: [Reaction!]!
    attachments: [Attachment!]!
    editedAt: DateTime
    createdAt: DateTime!
  }

  type MessageConnection {
    edges: [MessageEdge!]!
    pageInfo: PageInfo!
  }

  type MessageEdge {
    node: Message!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    endCursor: String
  }

  type Reaction {
    id: ID!
    emoji: String!
    user: User!
  }

  type Attachment {
    id: ID!
    url: String!
    name: String!
    size: Int!
    mimeType: String!
  }

  type UserStatusEvent {
    userId: ID!
    status: UserStatus!
    lastSeenAt: DateTime
  }

  type TypingEvent {
    roomId: ID!
    userId: ID!
    isTyping: Boolean!
  }

  enum UserStatus {
    ONLINE
    AWAY
    DND
    OFFLINE
  }

  enum RoomType {
    DIRECT
    GROUP
    CHANNEL
  }

  enum RoomRole {
    OWNER
    ADMIN
    MODERATOR
    MEMBER
  }

  enum MessageType {
    TEXT
    IMAGE
    FILE
    SYSTEM
  }

  scalar DateTime
`

// Resolvers (simplified)
const resolvers = {
  Query: {
    me: () => ({ id: '1', username: 'demo', status: 'ONLINE' }),
    rooms: () => [],
    messages: () => ({ edges: [], pageInfo: { hasNextPage: false } }),
  },
  Mutation: {
    sendMessage: async (_: any, args: any) => {
      const message = { id: '1', content: args.content, type: args.type || 'TEXT' }
      pubsub.publish('message:created', args.roomId, message as any)
      return message
    },
  },
  Subscription: {
    messageCreated: {
      subscribe: (_: any, args: any) => pubsub.subscribe('message:created', args.roomId),
      resolve: (payload: any) => payload,
    },
    typingIndicator: {
      subscribe: (_: any, args: any) => pubsub.subscribe('typing:start', args.roomId),
      resolve: (payload: any) => payload,
    },
  },
}

// Create Yoga server
const yoga = createYoga({
  schema: {
    typeDefs,
    resolvers,
  },
  graphqlEndpoint: '/graphql',
  graphiql: {
    subscriptionsProtocol: 'WS',
  },
})

// Create HTTP server
const server = createServer(yoga)

// Create WebSocket server for subscriptions
const wsServer = new WebSocketServer({
  server,
  path: '/graphql',
})

// Use graphql-ws for WebSocket handling
useServer(
  {
    execute: (args: any) => args.rootValue.execute(args),
    subscribe: (args: any) => args.rootValue.subscribe(args),
    onConnect: async (ctx) => {
      console.log('Client connected')
    },
    onDisconnect: async (ctx) => {
      console.log('Client disconnected')
    },
  },
  wsServer
)

const port = Number(process.env.PORT) || 4000
server.listen(port, () => {
  console.log(`
  🚀 Realtime Chat API running at http://localhost:${port}/graphql
  🔌 WebSocket subscriptions at ws://localhost:${port}/graphql

  Features:
  - Real-time messaging with GraphQL subscriptions
  - Typing indicators
  - User presence/status
  - Message reactions
  - File attachments
  `)
})

// Types
interface Message {
  id: string
  content: string
  type: string
  senderId: string
  roomId: string
}
