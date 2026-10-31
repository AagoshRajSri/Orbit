/**
 * FeedPage — Orbit Feed System
 *
 * The main discovery feed page at /feed.
 * Features:
 *  - Sort tabs (Trending / Recent / Top)
 *  - Post card list with optimistic voting
 *  - Infinite scroll via react-intersection-observer
 *  - Post creation composer
 *  - Click-through to VirtualizedThread for comment reading
 *  - Real-time new post injection via socket
 *
 * Socket integration:
 *  This component subscribes to feed:global room on mount and
 *  unsubscribes on unmount — following the same pattern as existing
 *  Nexus and Chat socket rooms in App.jsx.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  TrendingUp,
  Clock,
  Trophy,
  Plus,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Link,
  Image,
  X,
  Loader2,
  Flame,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useFeedStore } from "../store/useFeedStore";
import { useThreadStore } from "../store/useThreadStore";
import { useAuthStore } from "../store/useAuthStore";
import VirtualizedThread from "../components/feed/VirtualizedThread";
import { getSocket } from "../lib/socket";

// ── Sort Tabs ─────────────────────────────────────────────────────────────────
const SORT_TABS = [
  { key: "trending", label: "Hot", Icon: Flame },
  { key: "recent", label: "New", Icon: Clock },
  { key: "top", label: "Top", Icon: Trophy },
];

// ── Post Composer ─────────────────────────────────────────────────────────────
const PostComposer = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    await onSubmit({ title: title.trim(), body: body.trim() });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-2xl border border-base-content/10 bg-base-100/80 backdrop-blur-sm p-4 mb-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-base-content">Create Post</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-base-content/8 text-base-content/40 hover:text-base-content/70 transition-colors"
        >
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
          className="w-full bg-base-200/50 border border-base-content/10 rounded-xl px-3 py-2 text-sm text-base-content placeholder:text-base-content/30 focus:outline-none focus:border-primary/40 transition-colors"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Body (optional)"
          rows={3}
          maxLength={40000}
          className="w-full bg-base-200/50 border border-base-content/10 rounded-xl px-3 py-2 text-sm text-base-content placeholder:text-base-content/30 focus:outline-none focus:border-primary/40 resize-none transition-colors"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-base-content/50 hover:text-base-content/80 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="px-4 py-1.5 text-sm rounded-xl bg-primary text-primary-content font-medium disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
            Post
          </button>
        </div>
      </form>
    </motion.div>
  );
};

// ── Post Card ─────────────────────────────────────────────────────────────────
const PostCard = ({ post, onVote, onOpenThread }) => {
  const postId = post._id?.toString() || post._id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-base-content/8 bg-base-100/60 backdrop-blur-sm
                 hover:border-base-content/16 hover:bg-base-100/80 transition-all duration-200
                 group cursor-pointer"
      onClick={() => onOpenThread(postId)}
    >
      <div className="flex gap-3 p-4">
        {/* ── Vote Column ──────────────────────────────────────────────────── */}
        <div
          className="flex flex-col items-center gap-1 flex-shrink-0"
          onClick={(e) => e.stopPropagation()} // Prevent card click when voting
        >
          <button
            onClick={() => onVote(postId, 1)}
            className={`p-1 rounded-lg transition-all duration-150 ${
              post.userVote === 1
                ? "text-orange-400 bg-orange-500/15 scale-110"
                : "text-base-content/30 hover:text-orange-400 hover:bg-orange-500/10"
            }`}
            aria-label="Upvote"
          >
            <ChevronUp className="size-4" strokeWidth={2.5} />
          </button>

          <span
            className={`text-xs font-bold tabular-nums leading-none ${
              post.score > 0
                ? "text-orange-400"
                : post.score < 0
                ? "text-blue-400"
                : "text-base-content/40"
            }`}
          >
            {post.score > 0 ? "+" : ""}
            {post.score}
          </span>

          <button
            onClick={() => onVote(postId, -1)}
            className={`p-1 rounded-lg transition-all duration-150 ${
              post.userVote === -1
                ? "text-blue-400 bg-blue-500/15 scale-110"
                : "text-base-content/30 hover:text-blue-400 hover:bg-blue-500/10"
            }`}
            aria-label="Downvote"
          >
            <ChevronDown className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* ── Content Column ────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {post.authorId?.profilePic ? (
              <img
                src={post.authorId.profilePic}
                alt={post.authorId.username}
                className="size-4 rounded-full object-cover"
              />
            ) : (
              <div className="size-4 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[8px] font-bold text-primary">
                  {(post.authorId?.username || "?").charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="text-[11px] text-base-content/40">
              {post.authorId?.username || "Anonymous"}
            </span>
            <span className="text-[11px] text-base-content/25">·</span>
            <span className="text-[11px] text-base-content/30">
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : ""}
            </span>
            {post.tags?.length > 0 && (
              <>
                <span className="text-[11px] text-base-content/25">·</span>
                {post.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-sm text-base-content leading-snug mb-1.5 group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>

          {/* Body preview */}
          {post.body && (
            <p className="text-xs text-base-content/50 leading-relaxed line-clamp-2 mb-2">
              {post.body}
            </p>
          )}

          {/* Link preview */}
          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary transition-colors mb-2"
            >
              <ExternalLink className="size-3" />
              <span className="truncate max-w-[200px]">{post.linkUrl}</span>
            </a>
          )}

          {/* Count bar */}
          <div className="flex items-center gap-4 text-[11px] text-base-content/40 pt-1.5 border-t border-base-content/5 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenThread(postId);
              }}
              className="flex items-center gap-1.5 hover:text-primary transition-colors font-medium text-base-content/60"
            >
              <MessageSquare className="size-3.5" />
              <span>{post.commentCount ?? 0} comment{post.commentCount !== 1 ? "s" : ""}</span>
            </button>
            <span className="flex items-center gap-1 text-orange-400/80">
              <ChevronUp className="size-3.5" />
              <span>{post.upvotes ?? 0} upvotes</span>
            </span>
            <span className="flex items-center gap-1 text-blue-400/80">
              <ChevronDown className="size-3.5" />
              <span>{post.downvotes ?? 0} downvotes</span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ── FeedPage ──────────────────────────────────────────────────────────────────
const FeedPage = () => {
  const [showComposer, setShowComposer] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState(null); // postId of open thread

  // Feed store
  const posts = useFeedStore((s) => s.posts);
  const sort = useFeedStore((s) => s.sort);
  const isLoading = useFeedStore((s) => s.isLoading);
  const isLoadingMore = useFeedStore((s) => s.isLoadingMore);
  const hasMore = useFeedStore((s) => s.hasMore);
  const error = useFeedStore((s) => s.error);
  const loadFeed = useFeedStore((s) => s.loadFeed);
  const loadMore = useFeedStore((s) => s.loadMore);
  const setSort = useFeedStore((s) => s.setSort);
  const votePost = useFeedStore((s) => s.votePost);
  const createPost = useFeedStore((s) => s.createPost);
  const handleMetricsSync = useFeedStore((s) => s.handleMetricsSync);
  const handleNewPost = useFeedStore((s) => s.handleNewPost);
  const handleCommentCountUpdate = useFeedStore((s) => s.handleCommentCountUpdate);

  // Thread store socket handlers
  const handleNewComment = useThreadStore((s) => s.handleNewComment);
  const handleThreadMetricsSync = useThreadStore((s) => s.handleMetricsSync);
  const handleCommentMetricsSync = useThreadStore((s) => s.handleCommentMetricsSync);

  // Infinite scroll sentinel
  const { ref: sentinelRef, inView } = useInView({ threshold: 0 });

  // ── Socket subscription ──────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join global feed room for new post notifications
    socket.emit("feed:join_feed", {});

    // Listen for real-time updates
    socket.on("feed:metrics_sync", handleMetricsSync);
    socket.on("feed:new_post", handleNewPost);
    socket.on("feed:new_comment", handleNewComment);
    socket.on("feed:comment_count_update", handleCommentCountUpdate);

    return () => {
      socket.emit("feed:leave_feed", {});
      socket.off("feed:metrics_sync", handleMetricsSync);
      socket.off("feed:new_post", handleNewPost);
      socket.off("feed:new_comment", handleNewComment);
      socket.off("feed:comment_count_update", handleCommentCountUpdate);
    };
  }, [handleMetricsSync, handleNewPost, handleNewComment, handleCommentCountUpdate]);

  // ── Thread socket room subscription ──────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (activeThreadId) {
      socket.emit("feed:join_thread", { postId: activeThreadId });
      socket.on("feed:metrics_sync", handleThreadMetricsSync);
      socket.on("feed:comment_metrics_sync", handleCommentMetricsSync);
    }
    return () => {
      if (activeThreadId && socket) {
        socket.emit("feed:leave_thread", { postId: activeThreadId });
        socket.off("feed:metrics_sync", handleThreadMetricsSync);
        socket.off("feed:comment_metrics_sync", handleCommentMetricsSync);
      }
    };
  }, [activeThreadId, handleThreadMetricsSync, handleCommentMetricsSync]);

  // ── Initial feed load ─────────────────────────────────────────────────────
  useEffect(() => {
    loadFeed();
  }, []);

  // ── Infinite scroll trigger ──────────────────────────────────────────────
  useEffect(() => {
    if (inView && !isLoadingMore && hasMore) {
      loadMore();
    }
  }, [inView]);

  const handleCreatePost = useCallback(
    async (postData) => {
      await createPost(postData);
    },
    [createPost]
  );

  // ── Thread view ───────────────────────────────────────────────────────────
  if (activeThreadId) {
    return (
      <div className="flex-1 overflow-hidden">
        <VirtualizedThread
          postId={activeThreadId}
          onBack={() => setActiveThreadId(null)}
        />
      </div>
    );
  }

  // ── Feed view ─────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* ── Top Bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-base-content/8 flex-shrink-0">
        <div className="flex-1 flex items-center gap-1 bg-base-200/40 rounded-xl p-1">
          {SORT_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                sort === key
                  ? "bg-base-100 text-base-content shadow-sm"
                  : "text-base-content/40 hover:text-base-content/70"
              }`}
            >
              <Icon className="size-3" />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowComposer((s) => !s)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-content text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="size-3.5" />
          Post
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Composer */}
        <AnimatePresence>
          {showComposer && (
            <PostComposer
              onClose={() => setShowComposer(false)}
              onSubmit={handleCreatePost}
            />
          )}
        </AnimatePresence>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary/50" />
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-base-content/40">
            <AlertCircle className="size-8" />
            <p className="text-sm">{error}</p>
            <button
              onClick={loadFeed}
              className="text-xs text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-base-content/30">
            <TrendingUp className="size-10 opacity-30" />
            <p className="text-sm font-medium">No posts yet</p>
            <button
              onClick={() => setShowComposer(true)}
              className="text-xs text-primary hover:underline"
            >
              Be the first to post
            </button>
          </div>
        )}

        {/* Post cards */}
        <AnimatePresence>
          {posts.map((post) => (
            <PostCard
              key={post._id?.toString() || post._id}
              post={post}
              onVote={votePost}
              onOpenThread={setActiveThreadId}
            />
          ))}
        </AnimatePresence>

        {/* Infinite scroll sentinel */}
        {hasMore && !isLoading && (
          <div ref={sentinelRef} className="flex items-center justify-center py-4">
            {isLoadingMore && (
              <Loader2 className="size-4 animate-spin text-primary/40" />
            )}
          </div>
        )}

        {/* End of feed indicator */}
        {!hasMore && posts.length > 0 && (
          <div className="text-center py-6 text-xs text-base-content/25">
            You've seen it all ✓
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedPage;
