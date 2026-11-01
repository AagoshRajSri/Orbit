"use client";

/**
 * useFeedStore.ts
 *
 * Zustand feed store for the Next.js frontend.
 * Ported from the Vite frontend with process.env adjustments.
 *
 * This store handles:
 *  - Paginated feed posts (cursor-based)
 *  - Optimistic vote mutations with rollback
 *  - Real-time metric sync from Socket.IO feed:metrics_sync events
 *  - Post creation and deletion
 */

import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";

export interface PostAuthor {
  _id?: string;
  id?: string;
  username: string;
  profilePic?: string;
  avatar?: string;
}

export interface Post {
  _id: string;
  id?: string;
  title: string;
  body?: string;
  content?: string;
  score: number;
  upvotes: number;
  downvotes: number;
  userVote?: number; // 0 | 1 | -1
  commentCount?: number;
  linkUrl?: string;
  imageUrl?: string;
  tags?: string[];
  createdAt?: string;
  author?: PostAuthor;
  authorId?: PostAuthor;
}

interface MetricsSyncPayload {
  postId?: string;
  targetId?: string;
  targetType?: string;
  score?: number;
  upvotes?: number;
  downvotes?: number;
  netDelta?: number;
}

interface FeedState {
  posts: Post[];
  nextCursor: string | null;
  sort: "trending" | "recent" | "top";
  nexusId: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;

  setSort: (sort: "trending" | "recent" | "top") => void;
  setNexusId: (id: string | null) => void;
  loadFeed: () => Promise<void>;
  loadMore: () => Promise<void>;
  votePost: (postId: string, intent: 1 | -1) => Promise<void>;
  createPost: (data: Partial<Post>) => Promise<Post | null>;
  deletePost: (postId: string) => Promise<void>;
  handleMetricsSync: (data: MetricsSyncPayload) => void;
  handleNewPost: (data: { post: Post }) => void;
  handleCommentCountUpdate: (data: { postId: string; commentCount?: number }) => void;
  syncPostVote: (postId: string, voteData: Partial<Post>) => void;
  clearFeed: () => void;
}

const computeOptimisticVote = (post: Post, intent: 1 | -1) => {
  const prev = post.userVote ?? 0;
  const effective = prev === intent ? 0 : intent;
  let { upvotes, downvotes } = post;
  if (prev === 1) upvotes -= 1;
  if (prev === -1) downvotes -= 1;
  if (effective === 1) upvotes += 1;
  if (effective === -1) downvotes += 1;
  return {
    score: upvotes - downvotes,
    upvotes: Math.max(upvotes, 0),
    downvotes: Math.max(downvotes, 0),
    userVote: effective,
  };
};

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  nextCursor: null,
  sort: "trending",
  nexusId: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,

  setSort: (sort) => {
    if (!["trending", "recent", "top"].includes(sort)) return;
    set({ sort, posts: [], nextCursor: null, hasMore: true });
    get().loadFeed();
  },

  setNexusId: (nexusId) => {
    set({ nexusId: nexusId || null, posts: [], nextCursor: null, hasMore: true });
  },

  loadFeed: async () => {
    const { sort, nexusId } = get();
    set({ isLoading: true, error: null, posts: [], nextCursor: null, hasMore: true });
    try {
      const params: Record<string, unknown> = { sort, limit: 20 };
      if (nexusId) params.nexusId = nexusId;
      const res = await axiosInstance.get("/feed", { params });
      const { posts, nextCursor } = res.data.data;
      set({ posts, nextCursor, hasMore: !!nextCursor, isLoading: false });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } } };
      set({ error: e.response?.data?.error?.message ?? "Failed to load feed", isLoading: false });
    }
  },

  loadMore: async () => {
    const { sort, nexusId, nextCursor, isLoadingMore, hasMore } = get();
    if (isLoadingMore || !hasMore || !nextCursor) return;
    set({ isLoadingMore: true });
    try {
      const params: Record<string, unknown> = { sort, limit: 20, cursor: nextCursor };
      if (nexusId) params.nexusId = nexusId;
      const res = await axiosInstance.get("/feed", { params });
      const { posts: newPosts, nextCursor: newCursor } = res.data.data;
      set((s) => ({
        posts: [...s.posts, ...newPosts],
        nextCursor: newCursor,
        hasMore: !!newCursor,
        isLoadingMore: false,
      }));
    } catch {
      set({ isLoadingMore: false });
    }
  },

  votePost: async (postId, intent) => {
    const { posts } = get();
    const idx = posts.findIndex((p) => p._id === postId || p._id?.toString() === postId);
    if (idx === -1) return;
    const post = posts[idx];
    const snapshot = { score: post.score, upvotes: post.upvotes, downvotes: post.downvotes, userVote: post.userVote };
    const optimistic = computeOptimisticVote(post, intent);
    set((s) => ({ posts: s.posts.map((p, i) => (i === idx ? { ...p, ...optimistic } : p)) }));
    try {
      const res = await axiosInstance.post(`/feed/posts/${postId}/vote`, { intent: intent.toString() });
      const { resultVote, newScore, upvotes, downvotes } = res.data.data;
      set((s) => ({
        posts: s.posts.map((p, i) =>
          i === idx ? { ...p, score: newScore, upvotes, downvotes, userVote: resultVote } : p
        ),
      }));
    } catch {
      set((s) => ({ posts: s.posts.map((p, i) => (i === idx ? { ...p, ...snapshot } : p)) }));
    }
  },

  createPost: async (postData) => {
    try {
      const res = await axiosInstance.post("/feed/posts", postData);
      const newPost = res.data.data as Post;
      set((s) => ({ posts: [newPost, ...s.posts] }));
      return newPost;
    } catch {
      return null;
    }
  },

  deletePost: async (postId) => {
    set((s) => ({ posts: s.posts.filter((p) => p._id !== postId && p._id?.toString() !== postId) }));
    try {
      await axiosInstance.delete(`/feed/posts/${postId}`);
    } catch {
      get().loadFeed();
    }
  },

  handleMetricsSync: (data) => {
    const targetId = data?.postId || (data?.targetType === "post" ? data?.targetId : null);
    if (!targetId) return;
    set((s) => ({
      posts: s.posts.map((p) => {
        if ((p._id?.toString() || p._id) !== targetId) return p;
        return {
          ...p,
          score: data.score !== undefined ? data.score : p.score,
          upvotes: data.upvotes !== undefined ? data.upvotes : p.upvotes,
          downvotes: data.downvotes !== undefined ? data.downvotes : p.downvotes,
        };
      }),
    }));
  },

  handleNewPost: (data) => {
    if (get().sort === "recent") {
      set((s) => ({ posts: [data.post, ...s.posts] }));
    }
  },

  handleCommentCountUpdate: (data) => {
    const { postId, commentCount } = data;
    if (!postId) return;
    set((s) => ({
      posts: s.posts.map((p) => {
        if ((p._id?.toString() || p._id) !== postId) return p;
        return { ...p, commentCount: commentCount !== undefined ? commentCount : (p.commentCount ?? 0) + 1 };
      }),
    }));
  },

  syncPostVote: (postId, voteData) => {
    set((s) => ({
      posts: s.posts.map((p) =>
        (p._id?.toString() || p._id) === postId ? { ...p, ...voteData } : p
      ),
    }));
  },

  clearFeed: () => {
    set({ posts: [], nextCursor: null, sort: "trending", nexusId: null, isLoading: false, isLoadingMore: false, hasMore: true, error: null });
  },
}));
