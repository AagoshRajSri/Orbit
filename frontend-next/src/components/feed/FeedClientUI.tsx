"use client";

/**
 * FeedClientUI.tsx  — Client Component
 *
 * This is the interactive layer of the /feed route. It:
 *  1. Accepts `initialPosts` from the RSC page (pre-fetched via GraphQL SSR)
 *     and seeds the Zustand feed store on mount — preventing a second fetch.
 *  2. Subscribes to Socket.IO feed:metrics_sync and feed:new_post events
 *     inside a useEffect (strictly client-side, never SSR).
 *  3. Handles optimistic voting, post creation, and infinite scroll.
 *
 * SSR Guard: getSocket() is called ONLY inside useEffect, never at module level
 * or component body top-level. This prevents Next.js from attempting to create a
 * WebSocket during the server-render phase which causes a build error.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  TrendingUp, Clock, Trophy, Plus, ChevronUp, ChevronDown,
  MessageSquare, X, Loader2, Flame, AlertCircle, ExternalLink,
} from "lucide-react";
import { useFeedStore, type Post } from "@/store/useFeedStore";
import { useAuthStore } from "@/store/useAuthStore";
import dynamic from "next/dynamic";

const VirtualizedThread = dynamic(
  () => import("@/components/feed/VirtualizedThread"),
  {
    loading: () => (
      <div className="flex-1 h-full flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-violet-400" />
      </div>
    ),
    ssr: false,
  }
);

interface FeedClientUIProps {
  initialPosts: Post[];
  initialCursor: string | null;
  initialHasMore: boolean;
}

const SORT_TABS = [
  { key: "trending" as const, label: "Hot", Icon: Flame },
  { key: "recent" as const,   label: "New", Icon: Clock },
  { key: "top" as const,      label: "Top", Icon: Trophy },
];

// ── Post Composer ─────────────────────────────────────────────────────────────
const PostComposer = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: (d: { title: string; body: string }) => Promise<void> }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    await onSubmit({ title: title.trim(), body: body.trim() });
    setSubmitting(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-white">Create Post</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/70 transition-colors">
          <X className="size-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (required)"
          maxLength={300}
          required
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/40 transition-colors"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body (optional)"
          rows={3}
          maxLength={40000}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/40 resize-none transition-colors"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-sm text-white/50 hover:text-white/80 transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={!title.trim() || submitting}
            className="px-4 py-1.5 text-sm rounded-xl bg-violet-600 text-white font-medium disabled:opacity-40 hover:bg-violet-500 transition-colors flex items-center gap-2"
          >
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Post
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, onVote, onOpenThread }: { post: Post; onVote: (id: string, v: 1 | -1) => void; onOpenThread: (id: string) => void }) => {
  const postId = (post.id || post._id)?.toString() || "";
  // Support both REST (authorId) and GraphQL (author) field names
  const author = post.author ?? post.authorId;

  return (
    <motion.article
      layout
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-white/4 backdrop-blur-sm
                 hover:border-white/16 hover:bg-white/6 transition-all duration-200
                 group cursor-pointer"
      onClick={() => onOpenThread(postId)}
    >
      <div className="flex gap-3 p-4">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            id={`upvote-${postId}`}
            onClick={() => onVote(postId, 1)}
            className={`p-1 rounded-lg transition-all duration-150 ${
              post.userVote === 1 ? "text-orange-400 bg-orange-500/15 scale-110" : "text-white/30 hover:text-orange-400 hover:bg-orange-500/10"
            }`}
            aria-label="Upvote"
          >
            <ChevronUp className="size-4" strokeWidth={2.5} />
          </button>
          <span className={`text-xs font-bold tabular-nums leading-none ${
            post.score > 0 ? "text-orange-400" : post.score < 0 ? "text-blue-400" : "text-white/40"
          }`}>
            {post.score > 0 ? "+" : ""}{post.score}
          </span>
          <button
            id={`downvote-${postId}`}
            onClick={() => onVote(postId, -1)}
            className={`p-1 rounded-lg transition-all duration-150 ${
              post.userVote === -1 ? "text-blue-400 bg-blue-500/15 scale-110" : "text-white/30 hover:text-blue-400 hover:bg-blue-500/10"
            }`}
            aria-label="Downvote"
          >
            <ChevronDown className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            {author?.profilePic ? (
              <img src={author.profilePic} alt={author.username} className="size-4 rounded-full object-cover" />
            ) : (
              <div className="size-4 rounded-full bg-violet-500/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-violet-400">
                  {(author?.username ?? "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[11px] text-white/40">{author?.username ?? "Anonymous"}</span>
            <span className="text-[11px] text-white/25">·</span>
            <span className="text-[11px] text-white/30">
              {post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
            </span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span className="text-[11px] text-white/25">·</span>
                {post.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400/70 font-medium">{tag}</span>
                ))}
              </>
            )}
          </div>
          <h3 className="font-semibold text-sm text-white leading-snug mb-1.5 group-hover:text-violet-300 transition-colors line-clamp-2">
            {post.title}
          </h3>
          {post.body && (
            <p className="text-xs text-white/50 leading-relaxed line-clamp-2 mb-2">{post.body}</p>
          )}
          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-violet-400/70 hover:text-violet-400 transition-colors mb-2"
            >
              <ExternalLink className="size-3" />
              <span className="truncate max-w-[200px]">{post.linkUrl}</span>
            </a>
          )}
          <div className="flex items-center gap-4 text-[11px] text-white/40 pt-1.5 border-t border-white/5 mt-2">
            <button
              id={`thread-${postId}`}
              onClick={(e) => { e.stopPropagation(); onOpenThread(postId); }}
              className="flex items-center gap-1.5 hover:text-violet-400 transition-colors font-medium text-white/60"
            >
              <MessageSquare className="size-3.5" />
              <span>{post.commentCount ?? 0} comment{post.commentCount !== 1 ? "s" : ""}</span>
            </button>
            <span className="flex items-center gap-1 text-orange-400/80">
              <ChevronUp className="size-3.5" />
              <span>{post.upvotes ?? 0}</span>
            </span>
            <span className="flex items-center gap-1 text-blue-400/80">
              <ChevronDown className="size-3.5" />
              <span>{post.downvotes ?? 0}</span>
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
};

// ── FeedClientUI ──────────────────────────────────────────────────────────────
export default function FeedClientUI({ initialPosts, initialCursor, initialHasMore }: FeedClientUIProps) {
  const [showComposer, setShowComposer] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  // Zustand store
  const storePosts     = useFeedStore((s) => s.posts);
  const posts          = storePosts.length > 0 ? storePosts : initialPosts;
  const sort           = useFeedStore((s) => s.sort);
  const isLoading      = useFeedStore((s) => s.isLoading);
  const isLoadingMore  = useFeedStore((s) => s.isLoadingMore);
  const hasMore        = useFeedStore((s) => s.hasMore);
  const error          = useFeedStore((s) => s.error);
  const loadFeed       = useFeedStore((s) => s.loadFeed);
  const loadMore       = useFeedStore((s) => s.loadMore);
  const setSort        = useFeedStore((s) => s.setSort);
  const votePost       = useFeedStore((s) => s.votePost);
  const createPost     = useFeedStore((s) => s.createPost);
  const handleMetrics  = useFeedStore((s) => s.handleMetricsSync);
  const handleNewPost  = useFeedStore((s) => s.handleNewPost);
  const handleComment  = useFeedStore((s) => s.handleCommentCountUpdate);
  const socketToken    = useAuthStore((s) => s.socketToken);

  // Infinite scroll sentinel
  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  // ── Seed Zustand with SSR data (runs once on mount) ────────────────────────
  // We bypass the REST fetch entirely if the RSC already gave us data.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    if (initialPosts.length > 0) {
      // Directly hydrate the store with the SSR data — zero network request
      useFeedStore.setState({
        posts: initialPosts,
        nextCursor: initialCursor,
        hasMore: initialHasMore,
        isLoading: false,
        error: null,
      });
    } else {
      // Fallback: RSC returned empty (backend was down), load via REST
      loadFeed();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket.IO subscription (SSR guard: useEffect only) ────────────────────
  useEffect(() => {
    // `import` is inside useEffect — NEVER at module level — so Next.js server
    // render never evaluates this code path.
    import("@/lib/socket").then(({ getSocket }) => {
      const socket = getSocket(socketToken);
      socket.emit("feed:join_feed", {});
      socket.on("feed:metrics_sync", handleMetrics);
      socket.on("feed:new_post", handleNewPost);
      socket.on("feed:comment_count_update", handleComment);

      return () => {
        socket.emit("feed:leave_feed", {});
        socket.off("feed:metrics_sync", handleMetrics);
        socket.off("feed:new_post", handleNewPost);
        socket.off("feed:comment_count_update", handleComment);
      };
    });
  }, [socketToken, handleMetrics, handleNewPost, handleComment]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    if (inView && !isLoadingMore && hasMore) loadMore();
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreatePost = useCallback(
    async (postData: { title: string; body: string }) => {
      await createPost(postData);
    },
    [createPost]
  );

  // ── Thread view ────────────────────────────────────────────────────────────
  if (activeThreadId) {
    return (
      <div className="flex-1 overflow-hidden">
        <VirtualizedThread postId={activeThreadId} onBack={() => setActiveThreadId(null)} />
      </div>
    );
  }

  // ── Feed view ──────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0">
        <div className="flex-1 flex items-center gap-1 bg-white/4 rounded-xl p-1">
          {SORT_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              id={`sort-${key}`}
              onClick={() => setSort(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                sort === key ? "bg-white/8 text-white shadow-sm" : "text-white/40 hover:text-white/70"
              }`}
            >
              <Icon className="size-3" />
              {label}
            </button>
          ))}
        </div>
        <button
          id="create-post-btn"
          onClick={() => setShowComposer((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-500 transition-colors"
        >
          <Plus className="size-3.5" />
          Post
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence>
          {showComposer && (
            <PostComposer
              onClose={() => setShowComposer(false)}
              onSubmit={handleCreatePost}
            />
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-violet-400/50" />
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/40">
            <AlertCircle className="size-8" />
            <p className="text-sm">{error}</p>
            <button onClick={loadFeed} className="text-xs text-violet-400 hover:underline">Retry</button>
          </div>
        )}

        {!isLoading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-white/30">
            <TrendingUp className="size-10 opacity-30" />
            <p className="text-sm font-medium">No posts yet</p>
            <button onClick={() => setShowComposer(true)} className="text-xs text-violet-400 hover:underline">
              Be the first to post
            </button>
          </div>
        )}

        <AnimatePresence>
          {posts.map((post) => (
            <PostCard
              key={(post.id || post._id)?.toString() || post.title}
              post={post}
              onVote={votePost}
              onOpenThread={setActiveThreadId}
            />
          ))}
        </AnimatePresence>

        {hasMore && !isLoading && (
          <div ref={sentinelRef} className="flex items-center justify-center py-4">
            {isLoadingMore && <Loader2 className="size-4 animate-spin text-violet-400/40" />}
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6 text-xs text-white/25">You've seen it all ✓</div>
        )}
      </div>
    </div>
  );
}
