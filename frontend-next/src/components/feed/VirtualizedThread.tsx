"use client";

/**
 * VirtualizedThread.tsx  — Client Component
 *
 * Renders a nested comment tree for a specific post.
 * Fetches data via Apollo useQuery (GraphQL GET_THREAD).
 *
 * This component is intentionally isolated from the SSR feed page because:
 *  - It requires interactive state (expand/collapse, reply forms)
 *  - It subscribes to Socket.IO thread room events
 *  - It uses Apollo useQuery for client-side real-time refetches
 *
 * Lazy-loaded via next/dynamic({ ssr: false }) in FeedClientUI.
 */

import { useState, useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_THREAD } from "@/lib/queries";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronUp, ChevronDown, MessageSquare, Loader2,
  AlertCircle, CornerDownRight,
} from "lucide-react";
import { axiosInstance } from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";

interface Author {
  _id: string;
  username: string;
  profilePic?: string;
}

interface Comment {
  id: string;
  _id?: string;
  body: string;
  score: number;
  upvotes: number;
  downvotes: number;
  depth: number;
  path: string;
  parentId?: string;
  createdAt?: string;
  author?: Author;
  replies?: Comment[];
}

interface ThreadPost {
  id: string;
  _id?: string;
  title: string;
  body?: string;
  content?: string;
  score: number;
  upvotes: number;
  downvotes: number;
  commentCount?: number;
  linkUrl?: string;
  tags?: string[];
  createdAt?: string;
  author?: Author;
  comments?: Comment[];
}

interface ThreadQueryData {
  thread: ThreadPost;
}

const MAX_DEPTH_INDENT = 4;
const DEPTH_INDENT_PX = 20;

// ── Comment Node (recursive) ───────────────────────────────────────────────────
const CommentNode = ({
  comment,
  postId,
  onVote,
  depth = 0,
}: {
  comment: Comment;
  postId: string;
  onVote: (id: string, intent: 1 | -1, type: "comment") => void;
  depth?: number;
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const author = comment.author;
  const indentLevel = Math.min(depth, MAX_DEPTH_INDENT);

  return (
    <div className="relative" style={{ marginLeft: `${indentLevel * DEPTH_INDENT_PX}px` }}>
      {depth > 0 && (
        <div
          className="absolute left-0 top-0 bottom-0 w-px bg-white/6 hover:bg-violet-400/30 transition-colors cursor-pointer"
          style={{ left: -12 }}
          onClick={() => setCollapsed((c) => !c)}
        />
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="py-2"
      >
        {/* Meta */}
        <div className="flex items-center gap-1.5 mb-1">
          {author?.profilePic ? (
            <img src={author.profilePic} alt={author.username} className="size-3.5 rounded-full object-cover" />
          ) : (
            <div className="size-3.5 rounded-full bg-violet-500/20 flex items-center justify-center">
              <span className="text-[7px] font-bold text-violet-400">{(author?.username ?? "?").charAt(0)}</span>
            </div>
          )}
          <span className="text-[11px] text-white/50 font-medium">{author?.username ?? "Deleted"}</span>
          <span className="text-[11px] text-white/25">·</span>
          <span className="text-[11px] text-white/30">
            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
          </span>
          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="ml-auto text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              {collapsed ? `[+${comment.replies.length}]` : "[–]"}
            </button>
          )}
        </div>

        {/* Body */}
        <p className="text-sm text-white/80 leading-relaxed">{comment.body}</p>

        {/* Actions */}
        {(() => {
          const commentId = comment.id || comment._id || "";
          return (
            <div className="flex items-center gap-3 mt-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                id={`comment-upvote-${commentId}`}
                onClick={() => onVote(commentId, 1, "comment")}
                className="flex items-center gap-0.5 text-[11px] text-white/30 hover:text-orange-400 transition-colors"
              >
                <ChevronUp className="size-3.5" />
                <span>{comment.upvotes}</span>
              </button>
              <button
                id={`comment-downvote-${commentId}`}
                onClick={() => onVote(commentId, -1, "comment")}
                className="flex items-center gap-0.5 text-[11px] text-white/30 hover:text-blue-400 transition-colors"
              >
                <ChevronDown className="size-3.5" />
                <span>{comment.downvotes}</span>
              </button>
              <span className={`text-[11px] font-bold ${comment.score > 0 ? "text-orange-400" : comment.score < 0 ? "text-blue-400" : "text-white/30"}`}>
                {comment.score > 0 ? "+" : ""}{comment.score}
              </span>
            </div>
          );
        })()}
      </motion.div>

      {/* Nested replies */}
      {!collapsed && comment.replies && comment.replies.length > 0 && (
        <AnimatePresence>
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply._id}
              comment={reply}
              postId={postId}
              onVote={onVote}
              depth={depth + 1}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
};

// ── VirtualizedThread ─────────────────────────────────────────────────────────
export default function VirtualizedThread({
  postId,
  onBack,
}: {
  postId: string;
  onBack: () => void;
}) {
  const [sort, setSort] = useState("top");
  const [replyBody, setReplyBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socketToken = useAuthStore((s) => s.socketToken);

  const { data, loading, error, refetch } = useQuery<ThreadQueryData>(GET_THREAD, {
    variables: { postId },
    notifyOnNetworkStatusChange: true,
  });

  const post: ThreadPost | undefined = data?.thread;
  const comments: Comment[] = data?.thread?.comments ?? [];

  // ── Socket.IO thread room (SSR guard: useEffect) ──────────────────────────
  useEffect(() => {
    import("@/lib/socket").then(({ getSocket }) => {
      const socket = getSocket(socketToken);
      socket.emit("feed:join_thread", { postId });

      const handleMetrics = () => refetch();
      socket.on("feed:metrics_sync", handleMetrics);
      socket.on("feed:comment_metrics_sync", handleMetrics);
      socket.on("feed:new_comment", () => refetch());

      return () => {
        socket.emit("feed:leave_thread", { postId });
        socket.off("feed:metrics_sync", handleMetrics);
        socket.off("feed:comment_metrics_sync", handleMetrics);
        socket.off("feed:new_comment");
      };
    });
  }, [postId, socketToken, refetch]);

  const handleVote = async (id: string, intent: 1 | -1, type: "comment") => {
    try {
      await axiosInstance.post(`/feed/${type}s/${id}/vote`, { intent: intent.toString() });
      refetch();
    } catch {/* optimistic already shown */ }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim() || !post) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.post(`/feed/posts/${post._id}/comments`, { body: replyBody.trim() });
      setReplyBody("");
      refetch();
    } catch {/* handled by error toast */ } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-white/40">
        <AlertCircle className="size-8" />
        <p className="text-sm">Failed to load thread</p>
        <button onClick={() => refetch()} className="text-xs text-violet-400 hover:underline">Retry</button>
      </div>
    );
  }

  const author = post.author;

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-white/8 bg-[#05070f]/90 backdrop-blur-sm flex-shrink-0">
        <button id="thread-back-btn" aria-label="Back to Feed" title="Back to Feed" onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/8 text-white/60 hover:text-white transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <span className="text-sm font-semibold text-white/80 line-clamp-1">{post.title}</span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Post body */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
          <div className="flex items-center gap-1.5 mb-2 text-[11px] text-white/40">
            {author?.profilePic && <img src={author.profilePic} alt={author.username} className="size-4 rounded-full object-cover" />}
            <span>{author?.username ?? "Anonymous"}</span>
            {post.createdAt && (
              <>
                <span className="text-white/25">·</span>
                <span>{new Date(post.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
              </>
            )}
          </div>
          <h1 className="font-semibold text-base text-white mb-2">{post.title}</h1>
          {post.body && <p className="text-sm text-white/70 leading-relaxed">{post.body}</p>}
          <div className="flex items-center gap-4 mt-3 text-[11px] text-white/40">
            <span className={`font-bold ${post.score > 0 ? "text-orange-400" : post.score < 0 ? "text-blue-400" : ""}`}>
              {post.score > 0 ? "+" : ""}{post.score} pts
            </span>
            <span className="flex items-center gap-1"><MessageSquare className="size-3.5" /> {post.commentCount ?? comments.length} comments</span>
          </div>
        </div>

        {/* Comment sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30 font-medium">Sort:</span>
          {["top", "new", "old"].map((s) => (
            <button
              key={s}
              id={`comment-sort-${s}`}
              onClick={() => setSort(s)}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                sort === s ? "bg-violet-500/20 text-violet-400" : "text-white/40 hover:text-white/70"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Reply composer */}
        <form onSubmit={handleReply} className="rounded-xl border border-white/8 bg-white/4 p-3">
          <div className="flex items-center gap-2 mb-2 text-xs text-white/40">
            <CornerDownRight className="size-3.5" />
            <span>Add a comment</span>
          </div>
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="What are your thoughts?"
            rows={2}
            className="w-full bg-transparent text-sm text-white placeholder:text-white/25 focus:outline-none resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              id="submit-comment-btn"
              disabled={!replyBody.trim() || isSubmitting}
              className="px-3 py-1 text-xs rounded-lg bg-violet-600 text-white font-medium disabled:opacity-40 hover:bg-violet-500 transition-colors flex items-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3 animate-spin" />}
              Comment
            </button>
          </div>
        </form>

        {/* Comments */}
        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="size-4 animate-spin text-violet-400/40" />
          </div>
        )}
        <div className="space-y-1">
          {comments.map((c) => (
            <CommentNode key={c.id || c._id} comment={c} postId={postId} onVote={handleVote} />
          ))}
        </div>
        {comments.length === 0 && !loading && (
          <div className="text-center py-8 text-xs text-white/25">
            No comments yet — be the first!
          </div>
        )}
      </div>
    </div>
  );
}
