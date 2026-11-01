/**
 * useThreadStore — Orbit Feed System
 *
 * Manages the comment thread state for an individual post view, including:
 *  - Raw comment fetch from /api/feed/posts/:postId/comments
 *  - Materialized path → flat 1D array conversion (for virtual windowing)
 *  - Branch collapse/expand micro-interaction
 *  - Optimistic comment creation and vote toggling with rollback
 *  - Real-time new comment injection from feed:new_comment socket events
 *
 * Tree Flattening Algorithm (Materialized Path → 1D Array):
 * ──────────────────────────────────────────────────────────
 * Input from server: an array sorted by (path ASC, createdAt ASC).
 * This ordering guarantees that a comment always appears AFTER its parent.
 *
 * We transform this into:
 *   [{ ...comment, depth, isCollapsed, isHidden }, ...]
 *
 * where isHidden is derived from the collapsed state of ancestor nodes.
 *
 * Branch Collapse Algorithm:
 *   1. collapsedSet = Set of comment IDs that the user has collapsed.
 *   2. For each comment in flat order:
 *      a. Check if any ancestor ID is in collapsedSet.
 *         "ancestor" = any ID that appears as a path segment before this comment's ID.
 *         Since path = "/postId/grandparent/parent", we split by "/" and check.
 *      b. If any ancestor is collapsed → mark isHidden = true.
 *   3. When rendering, react-virtual skips isHidden items by filtering the list.
 *
 * This achieves O(n) collapse with NO recursive state, NO subtree traversal,
 * just a prefix path check per item.
 */

import { create } from "zustand";
import { axiosInstance } from "../lib/axios.jsx";
import toast from "../lib/toast";

/**
 * sortCommentsTree — Sorts comments by materialized path ASC, then createdAt ASC.
 * Guarantees that children always appear immediately nested beneath their parent.
 */
export const sortCommentsTree = (comments) => {
  return [...comments].sort((a, b) => {
    const pathCompare = (a.path || "").localeCompare(b.path || "");
    if (pathCompare !== 0) return pathCompare;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });
};

/**
 * flattenCommentTree — Converts server comment array to a virtualization-ready 1D array.
 *
 * @param {Array}  comments      — Raw comments from server, sorted by (path, createdAt)
 * @param {Set}    collapsedSet  — Set of comment _id strings that are collapsed
 * @returns {Array}              — Flat array with added { isCollapsed, isHidden } fields
 */
export const flattenCommentTree = (comments, collapsedSet = new Set()) => {
  return comments.map((comment) => {
    const commentId = comment._id?.toString() || comment._id;

    // Path format: "/postId/ancestorId/.../parentId"
    // Parse ancestor IDs from path (everything between slashes, excluding postId at [0])
    const pathSegments = comment.path
      ? comment.path.split("/").filter(Boolean)
      : [];

    // Ancestor comment IDs start at index 1 (index 0 is the postId)
    // Example path "/postId/grandparent/parent" → ancestors = ["grandparent", "parent"]
    const ancestorIds = pathSegments.slice(1);

    // A comment is hidden if ANY ancestor is in the collapsedSet
    const isHidden = ancestorIds.some((id) => collapsedSet.has(id));

    // A comment is itself "collapsed" (shows the expand toggle) if it's in collapsedSet
    const isCollapsed = collapsedSet.has(commentId);

    return {
      ...comment,
      depth: comment.depth ?? (pathSegments.length - 1),
      isCollapsed,
      isHidden,
    };
  });
};

/**
 * countVisibleReplies — Count how many direct+indirect children a comment has.
 * Used to show "N replies collapsed" label.
 *
 * @param {string} commentId  — The collapsed comment's ID
 * @param {Array}  comments   — Raw comments array (unflattened)
 * @returns {number}
 */
const countVisibleReplies = (commentId, comments) => {
  const prefix = `/${commentId}`;
  return comments.filter(
    (c) =>
      c.path &&
      (c.path.includes(prefix + "/") || c.path.endsWith(prefix))
  ).length;
};

// ── Active Thread Vote Locks ──────────────────────────────────────────────────
const _activeThreadVoteLocks = new Set();

// ── Store ─────────────────────────────────────────────────────────────────────
export const useThreadStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────────────────
  postId: null,
  post: null,
  rawComments: [],        // Server-returned flat list, sorted by (path, createdAt)
  flatComments: [],       // Virtualization-ready array with isHidden / isCollapsed
  collapsedSet: new Set(), // Set of comment IDs that are currently collapsed

  isLoadingPost: false,
  isLoadingComments: false,
  isSendingComment: false,
  error: null,

  // Optimistic comment ID tracker (to avoid duplicates from socket echo)
  _optimisticIds: new Set(),

  // ── Post Actions ────────────────────────────────────────────────────────────

  /**
   * loadPost — Fetch a single post and its comments.
   * Calling this automatically clears previous thread state.
   */
  loadPost: async (postId) => {
    set({
      postId,
      post: null,
      rawComments: [],
      flatComments: [],
      collapsedSet: new Set(),
      isLoadingPost: true,
      isLoadingComments: true,
      error: null,
    });

    try {
      // Parallel fetch post + comments
      const [postRes, commentsRes] = await Promise.all([
        axiosInstance.get(`/feed/posts/${postId}`),
        axiosInstance.get(`/feed/posts/${postId}/comments`),
      ]);

      const post = postRes.data.data;
      const rawComments = sortCommentsTree(commentsRes.data.data.comments || []);

      const flat = flattenCommentTree(rawComments, new Set());

      set({
        post,
        rawComments,
        flatComments: flat,
        isLoadingPost: false,
        isLoadingComments: false,
      });
    } catch (err) {
      console.error("[ThreadStore] loadPost error:", err);
      set({
        error: err.response?.data?.error?.message || "Failed to load thread",
        isLoadingPost: false,
        isLoadingComments: false,
      });
      toast.error("Failed to load thread");
    }
  },

  /**
   * clearThread — Resets thread state (call when navigating away from a post).
   */
  clearThread: () => {
    set({
      postId: null,
      post: null,
      rawComments: [],
      flatComments: [],
      collapsedSet: new Set(),
      isLoadingPost: false,
      isLoadingComments: false,
      isSendingComment: false,
      error: null,
      _optimisticIds: new Set(),
    });
  },

  // ── Branch Collapse Actions ─────────────────────────────────────────────────

  /**
   * collapseComment — Collapses a comment branch (hides all descendants).
   * @param {string} commentId
   */
  collapseComment: (commentId) => {
    set((state) => {
      const newSet = new Set(state.collapsedSet);
      newSet.add(commentId);
      return {
        collapsedSet: newSet,
        flatComments: flattenCommentTree(state.rawComments, newSet),
      };
    });
  },

  /**
   * expandComment — Expands a previously collapsed comment branch.
   * @param {string} commentId
   */
  expandComment: (commentId) => {
    set((state) => {
      const newSet = new Set(state.collapsedSet);
      newSet.delete(commentId);
      return {
        collapsedSet: newSet,
        flatComments: flattenCommentTree(state.rawComments, newSet),
      };
    });
  },

  /**
   * toggleCollapse — Toggle collapse state of a comment branch.
   * The primary handler for the collapse UI control.
   */
  toggleCollapse: (commentId) => {
    const { collapsedSet } = get();
    if (collapsedSet.has(commentId)) {
      get().expandComment(commentId);
    } else {
      get().collapseComment(commentId);
    }
  },

  /**
   * getCollapsedReplyCount — How many replies are hidden under a collapsed comment.
   */
  getCollapsedReplyCount: (commentId) => {
    const { rawComments } = get();
    return countVisibleReplies(commentId, rawComments);
  },

  // ── Comment Submission ──────────────────────────────────────────────────────

  /**
   * submitComment — Optimistically adds a comment and fires the API.
   *
   * @param {string} body       — Comment text
   * @param {string} [parentId] — Parent comment ID (null for top-level)
   * @returns {object|null}     — The created comment or null on error
   */
  submitComment: async (body, parentId = null) => {
    const { postId, rawComments, collapsedSet, _optimisticIds } = get();
    if (!postId) return null;

    const optimisticId = `optimistic-${Date.now()}`;

    // Build a minimal optimistic comment for instant display
    const optimisticComment = _buildOptimisticComment(
      optimisticId,
      postId,
      body,
      parentId,
      rawComments
    );

    // Track the optimistic ID so we can de-duplicate the socket echo
    const newOptimisticIds = new Set(_optimisticIds);
    newOptimisticIds.add(optimisticId);

    set((state) => {
      const newRaw = sortCommentsTree([...state.rawComments, optimisticComment]);
      return {
        rawComments: newRaw,
        flatComments: flattenCommentTree(newRaw, state.collapsedSet),
        isSendingComment: true,
        _optimisticIds: newOptimisticIds,
        post: state.post
          ? { ...state.post, commentCount: (state.post.commentCount || 0) + 1 }
          : state.post,
      };
    });

    // Notify feed store immediately for count bar sync
    try {
      import("./useFeedStore").then(({ useFeedStore }) => {
        useFeedStore.getState().handleCommentCountUpdate({
          postId,
          commentCount: (get().post?.commentCount || 0),
        });
      });
    } catch (_) {}

    try {
      const res = await axiosInstance.post(`/feed/posts/${postId}/comments`, {
        body,
        parentId: parentId || undefined,
      });
      const serverComment = res.data.data;

      // Replace optimistic comment with server-confirmed one
      set((state) => {
        const replaced = state.rawComments.map((c) =>
          c._id === optimisticId ? serverComment : c
        );
        const newRaw = sortCommentsTree(replaced);
        const updatedOptimisticIds = new Set(state._optimisticIds);
        updatedOptimisticIds.delete(optimisticId);
        return {
          rawComments: newRaw,
          flatComments: flattenCommentTree(newRaw, state.collapsedSet),
          isSendingComment: false,
          _optimisticIds: updatedOptimisticIds,
        };
      });

      return serverComment;
    } catch (err) {
      // Remove the optimistic comment on failure
      set((state) => {
        const newRaw = state.rawComments.filter((c) => c._id !== optimisticId);
        const updatedOptimisticIds = new Set(state._optimisticIds);
        updatedOptimisticIds.delete(optimisticId);
        return {
          rawComments: newRaw,
          flatComments: flattenCommentTree(newRaw, state.collapsedSet),
          isSendingComment: false,
          _optimisticIds: updatedOptimisticIds,
          post: state.post
            ? { ...state.post, commentCount: Math.max((state.post.commentCount || 1) - 1, 0) }
            : state.post,
        };
      });

      const msg = err.response?.data?.error?.message || "Failed to post comment";
      toast.error(msg);
      console.error("[ThreadStore] submitComment error:", err);
      return null;
    }
  },

  /**
   * votePost — Upvote or downvote the post directly from inside the thread view.
   * Updates post state optimistically and synchronizes with useFeedStore.
   */
  votePost: async (postId, intent) => {
    if (_activeThreadVoteLocks.has(postId)) return;
    _activeThreadVoteLocks.add(postId);

    try {
      const { post } = get();
      if (!post) return;

      const prev = post.userVote || 0;
      const effective = prev === intent ? 0 : intent;
      let upvotes = post.upvotes || 0;
      let downvotes = post.downvotes || 0;
      if (prev === 1) upvotes -= 1;
      if (prev === -1) downvotes -= 1;
      if (effective === 1) upvotes += 1;
      if (effective === -1) downvotes += 1;

      const snapshot = {
        score: post.score,
        upvotes: post.upvotes,
        downvotes: post.downvotes,
        userVote: post.userVote,
      };

      const optimistic = {
        score: upvotes - downvotes,
        upvotes: Math.max(upvotes, 0),
        downvotes: Math.max(downvotes, 0),
        userVote: effective,
      };

      set((state) => ({
        post: state.post ? { ...state.post, ...optimistic } : null,
      }));

      try {
        import("./useFeedStore").then(({ useFeedStore }) => {
          useFeedStore.getState().syncPostVote(postId, optimistic);
        });
      } catch (_) {}

      try {
        const res = await axiosInstance.post(`/feed/posts/${postId}/vote`, {
          intent: intent.toString(),
        });
        const { resultVote, newScore, upvotes: sv, downvotes: sd } = res.data.data;
        const confirmed = {
          score: newScore,
          upvotes: sv,
          downvotes: sd,
          userVote: resultVote,
        };

        set((state) => ({
          post: state.post ? { ...state.post, ...confirmed } : null,
        }));

        try {
          import("./useFeedStore").then(({ useFeedStore }) => {
            useFeedStore.getState().syncPostVote(postId, confirmed);
          });
        } catch (_) {}
      } catch (err) {
        set((state) => ({
          post: state.post ? { ...state.post, ...snapshot } : null,
        }));
        try {
          import("./useFeedStore").then(({ useFeedStore }) => {
            useFeedStore.getState().syncPostVote(postId, snapshot);
          });
        } catch (_) {}
        toast.error("Vote failed");
      }
    } finally {
      _activeThreadVoteLocks.delete(postId);
    }
  },

  // ── Comment Voting ─────────────────────────────────────────────────────────

  /**
   * voteComment — Optimistic vote on a comment with rollback.
   * @param {string} commentId
   * @param {number} intent — 1 | -1
   */
  voteComment: async (commentId, intent) => {
    if (_activeThreadVoteLocks.has(commentId)) return;
    _activeThreadVoteLocks.add(commentId);

    try {
      const { rawComments, collapsedSet, postId } = get();
      const idx = rawComments.findIndex(
        (c) => (c._id?.toString() || c._id) === commentId
      );
      if (idx === -1) return;

      const comment = rawComments[idx];

      // Snapshot for rollback
      const snapshot = {
        score: comment.score,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        userVote: comment.userVote,
      };

      // Compute optimistic values
      const prev = comment.userVote || 0;
      const effective = prev === intent ? 0 : intent;
      let upvotes = comment.upvotes;
      let downvotes = comment.downvotes;
      if (prev === 1) upvotes -= 1;
      if (prev === -1) downvotes -= 1;
      if (effective === 1) upvotes += 1;
      if (effective === -1) downvotes += 1;

      const optimistic = {
        score: upvotes - downvotes,
        upvotes: Math.max(upvotes, 0),
        downvotes: Math.max(downvotes, 0),
        userVote: effective,
      };

      // Apply optimistic update
      set((state) => {
        const newRaw = state.rawComments.map((c, i) =>
          i === idx ? { ...c, ...optimistic } : c
        );
        return {
          rawComments: newRaw,
          flatComments: flattenCommentTree(newRaw, state.collapsedSet),
        };
      });

      try {
        const res = await axiosInstance.post(`/feed/comments/${commentId}/vote`, {
          intent: intent.toString(),
          postId,
        });
        const { resultVote, newScore, upvotes: sv, downvotes: sd } = res.data.data;

        set((state) => {
          const newRaw = state.rawComments.map((c, i) =>
            i === idx
              ? { ...c, score: newScore, upvotes: sv, downvotes: sd, userVote: resultVote }
              : c
          );
          return {
            rawComments: newRaw,
            flatComments: flattenCommentTree(newRaw, state.collapsedSet),
          };
        });
      } catch (err) {
        // Rollback
        set((state) => {
          const newRaw = state.rawComments.map((c, i) =>
            i === idx ? { ...c, ...snapshot } : c
          );
          return {
            rawComments: newRaw,
            flatComments: flattenCommentTree(newRaw, state.collapsedSet),
          };
        });

        const code = err.response?.data?.error?.code;
        if (code === "RATE_LIMIT") {
          toast.warning("Voting too fast!");
        } else {
          toast.error("Vote failed. Please try again.");
        }
      }
    } finally {
      _activeThreadVoteLocks.delete(commentId);
    }
  },

  // ── Socket Event Handlers ─────────────────────────────────────────────────

  /**
   * handleMetricsSync — Real-time update for post score/votes while inside the thread.
   */
  handleMetricsSync: (data) => {
    const currentPostId = get().postId;
    const targetPostId = data?.postId || (data?.targetType === "post" ? data?.targetId : null);
    if (!currentPostId || currentPostId !== targetPostId) return;
    set((state) => ({
      post: state.post
        ? {
            ...state.post,
            score: data.score !== undefined ? data.score : state.post.score,
            upvotes: data.upvotes !== undefined ? data.upvotes : state.post.upvotes,
            downvotes: data.downvotes !== undefined ? data.downvotes : state.post.downvotes,
          }
        : null,
    }));
  },

  /**
   * handleCommentMetricsSync — Real-time update for comment scores within this thread.
   */
  handleCommentMetricsSync: (data) => {
    const { commentId, score, upvotes, downvotes } = data;
    if (!commentId) return;
    set((state) => {
      const newRaw = state.rawComments.map((c) => {
        const id = c._id?.toString() || c._id;
        if (id !== commentId) return c;
        return {
          ...c,
          score: score !== undefined ? score : c.score,
          upvotes: upvotes !== undefined ? upvotes : c.upvotes,
          downvotes: downvotes !== undefined ? downvotes : c.downvotes,
        };
      });
      return {
        rawComments: newRaw,
        flatComments: flattenCommentTree(newRaw, state.collapsedSet),
      };
    });
  },

  /**
   * handleNewComment — Inserts a socket-pushed comment into the thread.
   * Deduplicates against optimistic comments using _optimisticIds tracking.
   */
  handleNewComment: (data) => {
    const { postId, comment } = data;
    const storePostId = get().postId;
    if (!storePostId || storePostId !== postId) return;

    // De-duplicate: don't inject if we already have this from optimistic submission
    const commentId = comment._id?.toString() || comment._id;
    const existing = get().rawComments.some(
      (c) => (c._id?.toString() || c._id) === commentId
    );
    if (existing) return;

    set((state) => {
      const newRaw = sortCommentsTree([...state.rawComments, comment]);
      return {
        rawComments: newRaw,
        flatComments: flattenCommentTree(newRaw, state.collapsedSet),
        post: state.post
          ? { ...state.post, commentCount: (state.post.commentCount || 0) + 1 }
          : state.post,
      };
    });
  },
}));

// ── Internal Helper ───────────────────────────────────────────────────────────

/**
 * Builds a minimal optimistic comment node for immediate display.
 * Parent's path is used to compute the child's path correctly.
 */
function _buildOptimisticComment(id, postId, body, parentId, rawComments) {
  let path;
  let depth;

  if (!parentId) {
    path = `/${postId}`;
    depth = 0;
  } else {
    const parent = rawComments.find(
      (c) => (c._id?.toString() || c._id) === parentId
    );
    if (parent) {
      path = `${parent.path}/${parentId}`;
      depth = (parent.depth ?? 0) + 1;
    } else {
      path = `/${postId}/${parentId}`;
      depth = 1;
    }
  }

  return {
    _id: id,
    postId,
    parentId: parentId || null,
    path,
    depth,
    body,
    authorId: null, // Will be replaced by server response
    upvotes: 0,
    downvotes: 0,
    score: 0,
    userVote: 0,
    isDeleted: false,
    createdAt: new Date().toISOString(),
    _isOptimistic: true,
  };
}
