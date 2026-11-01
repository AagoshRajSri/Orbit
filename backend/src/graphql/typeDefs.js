/**
 * GraphQL Type Definitions — Orbit GraphQL API
 *
 * Defines the relational schema for Reddit-style posts, nested comment trees,
 * user identities, and feed queries.
 */
export const typeDefs = `#graphql
  """
  Represents a user profile in Orbit.
  """
  type User {
    id: ID!
    username: String!
    orbitId: String
    orbitTag: String
    normalizedHandle: String
    avatar: String
    profilePic: String
    bio: String
    isLocked: Boolean
    createdAt: String
  }

  """
  Represents a nested comment node in a thread hierarchy.
  Materialized path data is transformed into a nested replies tree.
  """
  type Comment {
    id: ID!
    postId: ID!
    parentId: ID
    path: String!
    depth: Int!
    content: String!
    body: String!
    author: User
    score: Int!
    upvotes: Int
    downvotes: Int
    isDeleted: Boolean!
    deletedAt: String
    replies: [Comment!]!
    createdAt: String!
    updatedAt: String
  }

  """
  Represents a root thread post in the Orbit feed.
  """
  type Post {
    id: ID!
    title: String!
    content: String
    body: String
    imageUrl: String
    linkUrl: String
    nexusId: ID
    author: User
    score: Int!
    upvotes: Int!
    downvotes: Int!
    commentCount: Int!
    hotRank: Float
    tags: [String!]
    comments: [Comment!]!
    isPinned: Boolean
    isLocked: Boolean
    createdAt: String!
    updatedAt: String
  }

  type Query {
    """
    Fetch a paginated feed of posts ordered by ranking/recency.
    Cursor is an optional timestamp or offset.
    """
    feed(cursor: String, limit: Int = 20): [Post!]!

    """
    Fetch a single thread post and its full nested comment tree by Post ID.
    """
    thread(postId: ID!): Post

    """
    Look up a user profile by ID or username.
    """
    userProfile(id: ID, username: String): User

    """
    Returns the currently authenticated user based on session token.
    """
    me: User
  }
`;
