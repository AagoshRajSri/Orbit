import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import User from "../models/user.model.js";

/**
 * Materialized Path Tree Reconstruction Algorithm
 *
 * Converts a flat array of Comment documents (retrieved in O(k) via compound index)
 * into a hierarchical tree where each node possesses its populated `replies` array.
 *
 * Time Complexity: O(N) linear single-pass hash-map reconstruction.
 * Space Complexity: O(N) pointers in memory without recursion.
 *
 * @param {Array<Object>} flatComments
 * @returns {Array<Object>} Nested array of root comments (depth 0)
 */
export function buildCommentTree(flatComments) {
  if (!flatComments || flatComments.length === 0) return [];

  const commentMap = new Map();
  const rootComments = [];

  // Pass 1: Instantiate nodes with empty replies list and normalized identifier
  for (const comment of flatComments) {
    const id = comment._id.toString();
    commentMap.set(id, {
      ...comment,
      id,
      content: comment.isDeleted ? "[deleted]" : (comment.body || ""),
      body: comment.isDeleted ? "[deleted]" : (comment.body || ""),
      replies: [],
    });
  }

  // Pass 2: Link children to their parent's replies array
  for (const comment of flatComments) {
    const id = comment._id.toString();
    const node = commentMap.get(id);

    if (comment.parentId) {
      const parentId = comment.parentId.toString();
      const parentNode = commentMap.get(parentId);
      if (parentNode) {
        parentNode.replies.push(node);
      } else {
        // If parent node is absent (e.g. filtered or wiped), promote to root level
        rootComments.push(node);
      }
    } else {
      rootComments.push(node);
    }
  }

  return rootComments;
}

export const resolvers = {
  Query: {
    /**
     * Resolves paginated public feed posts sorted by hot rank & recency.
     */
    feed: async (_parent, { cursor, limit = 20 }) => {
      const queryLimit = Math.min(Math.max(limit, 1), 50);
      const filter = { isDeleted: false, nexusId: null };

      if (cursor) {
        const cursorNum = Number(cursor);
        if (!Number.isNaN(cursorNum)) {
          filter.cursorTs = { $lt: cursorNum };
        } else {
          const date = new Date(cursor);
          if (!Number.isNaN(date.getTime())) {
            filter.createdAt = { $lt: date };
          }
        }
      }

      return await Post.find(filter)
        .sort({ hotRank: -1, cursorTs: -1 })
        .limit(queryLimit)
        .lean();
    },

    /**
     * Resolves a single root thread post by its ID.
     */
    thread: async (_parent, { postId }) => {
      if (!postId) return null;
      return await Post.findById(postId).lean();
    },

    /**
     * Resolves a user profile by ID or username.
     */
    userProfile: async (_parent, { id, username }, { loaders }) => {
      if (id) {
        return await loaders.userLoader.load(id.toString());
      }
      if (username) {
        return await User.findOne({ username })
          .select("username orbitId orbitTag normalizedHandle profilePic bio isLocked createdAt")
          .lean();
      }
      return null;
    },

    /**
     * Resolves the authenticated user from the GraphQL context.
     */
    me: (_parent, _args, { user }) => user || null,
  },

  Post: {
    id: (post) => (post._id ? post._id.toString() : post.id),
    content: (post) => post.body || post.content || "",
    body: (post) => post.body || post.content || "",
    score: (post) => post.score ?? (post.upvotes - post.downvotes) ?? 0,
    upvotes: (post) => post.upvotes ?? 0,
    downvotes: (post) => post.downvotes ?? 0,
    commentCount: (post) => post.commentCount ?? 0,
    createdAt: (post) => (post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString()),
    updatedAt: (post) => (post.updatedAt ? new Date(post.updatedAt).toISOString() : null),

    /**
     * Solves N+1 on post authors: batches user ID resolution through DataLoader.
     */
    author: (post, _args, { loaders }) => {
      const authorId = post.authorId?._id || post.authorId;
      if (!authorId) return null;
      return loaders.userLoader.load(authorId.toString());
    },

    /**
     * Fetches flat comments via Materialized Path compound index and rebuilds nested tree.
     */
    comments: async (post) => {
      const flatComments = await Comment.find({ postId: post._id })
        .sort({ path: 1 })
        .limit(500)
        .lean();
      return buildCommentTree(flatComments);
    },
  },

  Comment: {
    id: (comment) => (comment._id ? comment._id.toString() : comment.id),
    content: (comment) => (comment.isDeleted ? "[deleted]" : (comment.body || comment.content || "")),
    body: (comment) => (comment.isDeleted ? "[deleted]" : (comment.body || comment.content || "")),
    score: (comment) => comment.score ?? (comment.upvotes - comment.downvotes) ?? 0,
    upvotes: (comment) => comment.upvotes ?? 0,
    downvotes: (comment) => comment.downvotes ?? 0,
    isDeleted: (comment) => Boolean(comment.isDeleted),
    deletedAt: (comment) => (comment.deletedAt ? new Date(comment.deletedAt).toISOString() : null),
    createdAt: (comment) => (comment.createdAt ? new Date(comment.createdAt).toISOString() : new Date().toISOString()),
    updatedAt: (comment) => (comment.updatedAt ? new Date(comment.updatedAt).toISOString() : null),
    replies: (comment) => comment.replies || [],

    /**
     * Solves N+1 on comment authors: batches author IDs through DataLoader.
     */
    author: (comment, _args, { loaders }) => {
      if (comment.isDeleted) return null;
      const authorId = comment.authorId?._id || comment.authorId;
      if (!authorId) return null;
      return loaders.userLoader.load(authorId.toString());
    },
  },

  User: {
    id: (user) => (user._id ? user._id.toString() : user.id),
    avatar: (user) => user.profilePic || user.avatar || "",
    profilePic: (user) => user.profilePic || user.avatar || "",
    createdAt: (user) => (user.createdAt ? new Date(user.createdAt).toISOString() : null),
  },
};
