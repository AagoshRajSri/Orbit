/**
 * useFeedStore — Orbit Feed System
 *
 * Manages:
 *  - Paginated feed posts (trending / recent / top)
 *  - Optimistic vote mutations with rollback
 *  - Real-time metric sync from socket feed:metrics_sync events
 *  - Post creation and deletion
 *
 * Optimistic Vote Algorithm:
 * ─────────────────────────
 *  1. User clicks vote → instantly apply delta to local state (zero-latency UI)
 *  2. Fire axios.post to /api/feed/posts/:id/vote
 *  3a. If success → server confirms the new state → merge absolute values
 *  3b. If failure → revert to pre-vote snapshot and show error toast
 *
 * This pattern is identical to how Twitter/Reddit work. The user never waits
 * for a network round-trip to see their vote registered.
 */

import { create } from "zustand";
import { axiosInstance } from "../lib/axios.jsx";
import toast from "../lib/toast";

// ── Vote delta helpers ────────────────────────────────────────────────────────

/**
 * Computes the optimistic local state change when a user votes.
 *
 * @param {object} post      — Current post object from store
 * @param {number} intent    — 1 (upvote) | -1 (downvote)
 * @returns {object}         — Updated { score, upvotes, downvotes, userVote } fields
 */
const computeOptimisticVote = (post, intent) => {
  const prev = post.userVote || 0; // 0 | 1 | -1
  const effective = prev === intent ? 0 : intent; // toggle-off if same

  let upvotes = post.upvotes;
  let downvotes = post.downvotes;

  // Remove old vote
  if (prev === 1) upvotes -= 1;
  if (prev === -1) downvotes -= 1;

  // Apply new vote
  if (effective === 1) upvotes += 1;
  if (effective === -1) downvotes += 1;

  return {
    score: upvotes - downvotes,
    upvotes: Math.max(upvotes, 0),
    downvotes: Math.max(downvotes, 0),
    userVote: effective,
  };
};

// ── Active Vote Locks ────────────────────────────────────────────────────────
const _activeVoteLocks = new Set();

// ── Store ─────────────────────────────────────────────────────────────────────
export const useFeedStore = create((set, get) => ({
  // ── State ───────────────────────────────────────────────────────────────────
  posts: [],
  nextCursor: null,
  sort: "trending",         // "trending" | "recent" | "top"
  nexusId: null,            // Scope feed to a Nexus (null = global)
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * setSort — Switch feed sort mode and reload.
   * Clears existing posts so the loader shows a fresh state.
   */
  setSort: (sort) => {
    if (!["trending", "recent", "top"].includes(sort)) return;
    set({ sort, posts: [], nextCursor: null, hasMore: true });
    get().loadFeed();
  },

  /**
   * setNexusId — Scope the feed to a specific Nexus group.
   */
  setNexusId: (nexusId) => {
    set({ nexusId: nexusId || null, posts: [], nextCursor: null, hasMore: true });
  },

  /**
   * loadFeed — Initial feed load (clears existing posts).
   */
  loadFeed: async () => {
    const { sort, nexusId } = get();
    set({ isLoading: true, error: null, posts: [], nextCursor: null, hasMore: true });
    try {
      const params = { sort, limit: 20 };
      if (nexusId) params.nexusId = nexusId;

      const res = await axiosInstance.get("/feed", { params });
      const { posts, nextCursor } = res.data.data;

      set({
        posts,
        nextCursor,
        hasMore: !!nextCursor,
        isLoading: false,
      });
    } catch (err) {
      console.error("[FeedStore] loadFeed error:", err);
      set({
        error: err.response?.data?.error?.message || "Failed to load feed",
        isLoading: false,
      });
    }
  },

  /**
   * loadMore — Cursor-based "load next page" for infinite scroll.
   */
  loadMore: async () => {
    const { sort, nexusId, nextCursor, isLoadingMore, hasMore } = get();
    if (isLoadingMore || !hasMore || !nextCursor) return;

    set({ isLoadingMore: true });
    try {
      const params = { sort, limit: 20, cursor: nextCursor };
      if (nexusId) params.nexusId = nexusId;

      const res = await axiosInstance.get("/feed", { params });
      const { posts: newPosts, nextCursor: newCursor } = res.data.data;

      set((state) => ({
        posts: [...state.posts, ...newPosts],
        nextCursor: newCursor,
        hasMore: !!newCursor,
        isLoadingMore: false,
      }));
    } catch (err) {
      console.error("[FeedStore] loadMore error:", err);
      set({ isLoadingMore: false });
      toast.error("Failed to load more posts");
    }
  },

  /**
   * votePost — Optimistic voting with rollback.
   * @param {string} postId  — The post's _id
   * @param {number} intent  — 1 (upvote) | -1 (downvote)
   */
  votePost: async (postId, intent) => {
    if (_activeVoteLocks.has(postId)) return;
    _activeVoteLocks.add(postId);

    const { posts } = get();
    const idx = posts.findIndex((p) => p._id === postId || p._id?.toString() === postId);
    if (idx === -1) {
      _activeVoteLocks.delete(postId);
      return;
    }

    const post = posts[idx];

    // ── Step 1: Snapshot pre-vote state for rollback ─────────────────────────
    const snapshot = {
      score: post.score,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      userVote: post.userVote,
    };

    // ── Step 2: Apply optimistic update instantly ────────────────────────────
    const optimistic = computeOptimisticVote(post, intent);
    set((state) => ({
      posts: state.posts.map((p, i) =>
        i === idx ? { ...p, ...optimistic } : p
      ),
    }));

    // ── Step 3: Fire network request ─────────────────────────────────────────
    try {
      const res = await axiosInstance.post(`/feed/posts/${postId}/vote`, {
        intent: intent.toString(),
      });
      // Merge confirmed server values (overwrite optimistic with ground truth)
      const { resultVote, newScore, upvotes, downvotes } = res.data.data;
      set((state) => ({
        posts: state.posts.map((p, i) =>
          i === idx
            ? { ...p, score: newScore, upvotes, downvotes, userVote: resultVote }
            : p
        ),
      }));
    } catch (err) {
      // ── Step 4: Rollback on failure ──────────────────────────────────────
      set((state) => ({
        posts: state.posts.map((p, i) =>
          i === idx ? { ...p, ...snapshot } : p
        ),
      }));
      const code = err.response?.data?.error?.code;
      if (code === "RATE_LIMIT") {
        toast.warning("Voting too fast — slow down!");
      } else {
        toast.error("Vote failed. Please try again.");
      }
      console.error("[FeedStore] votePost error:", err);
    } finally {
      _activeVoteLocks.delete(postId);
    }
  },

  /**
   * createPost — Submit a new post and prepend it to the feed.
   * @param {object} postData — { title, body, imageUrl?, linkUrl?, nexusId?, tags? }
   * @returns {object|null}   — The created post, or null on error
   */
  createPost: async (postData) => {
    try {
      const res = await axiosInstance.post("/feed/posts", postData);
      const newPost = res.data.data;

      set((state) => ({
        posts: [newPost, ...state.posts],
      }));

      toast.success("Post created!");
      return newPost;
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Failed to create post";
      toast.error(msg);
      console.error("[FeedStore] createPost error:", err);
      return null;
    }
  },

  /**
   * deletePost — Remove a post from local state and call API.
   */
  deletePost: async (postId) => {
    // Optimistic removal
    set((state) => ({
      posts: state.posts.filter((p) => p._id !== postId && p._id?.toString() !== postId),
    }));

    try {
      await axiosInstance.delete(`/feed/posts/${postId}`);
      toast.success("Post deleted");
    } catch (err) {
      toast.error("Failed to delete post");
      console.error("[FeedStore] deletePost error:", err);
      // Reload to restore consistency
      get().loadFeed();
    }
  },

  // ── Socket Event Handlers ──────────────────────────────────────────────────

  /**
   * handleMetricsSync — Called by the socket listener in App.jsx when the server
   * pushes feed:metrics_sync. Merges absolute values (not deltas) so concurrent
   * updates from multiple users always converge to the same state.
   *
   * @param {object} data — { postId, score, upvotes, downvotes, netDelta }
   */
  handleMetricsSync: (data) => {
    const targetPostId = data?.postId || (data?.targetType === "post" ? data?.targetId : null);
    if (!targetPostId) return;
    const { score, upvotes, downvotes } = data;
    set((state) => ({
      posts: state.posts.map((p) => {
        const id = p._id?.toString() || p._id;
        if (id !== targetPostId) return p;
        // Only update metric fields — preserve userVote (user's own vote state)
        return {
          ...p,
          score: score !== undefined ? score : p.score,
          upvotes: upvotes !== undefined ? upvotes : p.upvotes,
          downvotes: downvotes !== undefined ? downvotes : p.downvotes,
        };
      }),
    }));
  },

  /**
   * handleCommentCountUpdate — Pushed when a new comment is added.
   * Updates the comment count in the feed card in real-time.
   */
  handleCommentCountUpdate: (data) => {
    const { postId, commentCount } = data;
    if (!postId) return;
    set((state) => ({
      posts: state.posts.map((p) => {
        const id = p._id?.toString() || p._id;
        if (id !== postId) return p;
        return {
          ...p,
          commentCount: commentCount !== undefined ? commentCount : (p.commentCount || 0) + 1,
        };
      }),
    }));
  },

  /**
   * syncPostVote — Syncs post vote state from thread view to feed list.
   */
  syncPostVote: (postId, voteData) => {
    if (!postId) return;
    set((state) => ({
      posts: state.posts.map((p) => {
        const id = p._id?.toString() || p._id;
        if (id !== postId) return p;
        return { ...p, ...voteData };
      }),
    }));
  },

  /**
   * handleNewPost — Called when feed:new_post is received from socket.
   * Prepends to feed only if current sort is "recent" to avoid re-ordering.
   */
  handleNewPost: (data) => {
    const { post } = data;
    const { sort } = get();
    if (sort === "recent") {
      set((state) => ({
        posts: [post, ...state.posts],
      }));
    }
  },

  /**
   * clearFeed — Resets all feed state (called on logout).
   */
  clearFeed: () => {
    set({
      posts: [],
      nextCursor: null,
      sort: "trending",
      nexusId: null,
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      error: null,
    });
  },
}));
