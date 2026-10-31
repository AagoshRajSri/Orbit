/**
 * VirtualizedThread — Orbit Feed System
 *
 * Renders a nested comment tree using @tanstack/react-virtual for DOM virtualization.
 * Only ~15 comments are ever in the DOM at once, regardless of thread size.
 *
 * Props:
 *   postId  — string: the post to load and display
 *   onBack  — function: called when user clicks "back to feed"
 *
 * Architecture:
 *   - useVirtualizer maps over the "visible" flat array (isHidden filtered out)
 *   - Each CommentRow renders indented by (depth × 20px)
 *   - Collapse control (chevron icon) calls toggleCollapse(commentId)
 *   - VoteControls handle optimistic up/down with animated counter
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Trash2,
  Loader2,
  Send,
  AlertCircle,
} from "lucide-react";
import { useThreadStore, flattenCommentTree } from "../../store/useThreadStore";
import { useAuthStore } from "../../store/useAuthStore";

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * VoteButton — Small animated up/down vote button.
 * Highlights when userVote matches its direction.
 */
const VoteButton = ({ direction, active, count, onClick }) => {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold transition-all duration-150 select-none
        ${active
          ? direction === "up"
            ? "text-orange-400 bg-orange-500/15 scale-110"
            : "text-blue-400 bg-blue-500/15 scale-110"
          : "text-base-content/40 hover:text-base-content/70 hover:bg-base-content/5"
        }`}
      aria-label={direction === "up" ? "Upvote" : "Downvote"}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      <span className="tabular-nums">{count}</span>
    </button>
  );
};

/**
 * CommentRow — Renders a single comment with indent, collapse control, and vote controls.
 */
const CommentRow = ({ comment, onToggleCollapse, onVote, onReply, currentUserId, onDelete }) => {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const isSendingComment = useThreadStore((s) => s.isSendingComment);
  const submitComment = useThreadStore((s) => s.submitComment);

  if (comment.isHidden) return null;

  const commentId = comment._id?.toString() || comment._id;
  const isDeleted = comment.isDeleted;
  const isOptimistic = comment._isOptimistic;
  const indentPx = Math.min(comment.depth, 7) * 20; // Max 7 levels of visual indent

  const authorUsername = comment.authorId?.username || (isDeleted ? "[deleted]" : "Anonymous");
  const authorPic = comment.authorId?.profilePic;

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    await submitComment(replyText.trim(), commentId);
    setReplyText("");
    setReplying(false);
  };

  return (
    <div
      className="flex gap-0 group"
      style={{ paddingLeft: `${indentPx}px` }}
    >
      {/* Thread line (visual depth indicator) */}
      {comment.depth > 0 && (
        <div className="w-px bg-base-content/10 group-hover:bg-base-content/20 mr-3 ml-0.5 flex-shrink-0 transition-colors" />
      )}

      <div className="flex-1 min-w-0 py-2">
        {/* Collapse toggle (only for comments with potential children) */}
        {comment.isCollapsed ? (
          <button
            onClick={() => onToggleCollapse(commentId)}
            className="flex items-center gap-1.5 text-xs text-base-content/40 hover:text-base-content/70 py-1 transition-colors"
          >
            <ChevronRight className="size-3" />
            <span className="font-medium">{authorUsername}</span>
            <span className="text-base-content/30">— branch collapsed</span>
          </button>
        ) : (
          <>
            {/* Comment header */}
            <div className="flex items-center gap-2 mb-1">
              {authorPic ? (
                <img
                  src={authorPic}
                  alt={authorUsername}
                  className="size-5 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-primary">
                    {authorUsername.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs font-semibold text-base-content/80">
                {authorUsername}
              </span>
              <span className="text-[10px] text-base-content/30">
                {comment.createdAt
                  ? new Date(comment.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })
                  : ""}
              </span>
              {isOptimistic && (
                <span className="text-[10px] text-base-content/30 italic">posting…</span>
              )}

              {/* Collapse control */}
              <button
                onClick={() => onToggleCollapse(commentId)}
                className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded text-base-content/30 hover:text-base-content/60"
                title="Collapse thread"
              >
                <ChevronDown className="size-3" />
              </button>
            </div>

            {/* Comment body */}
            <p
              className={`text-sm leading-relaxed text-base-content/80 break-words mb-2 ${
                isDeleted ? "italic text-base-content/30" : ""
              }`}
            >
              {comment.body}
            </p>

            {/* Actions row */}
            {!isOptimistic && !isDeleted && (
              <div className="flex items-center gap-3">
                {/* Vote controls */}
                <div className="flex items-center gap-1 bg-base-content/5 rounded-lg px-1 py-0.5">
                  <VoteButton
                    direction="up"
                    active={comment.userVote === 1}
                    count={comment.upvotes || 0}
                    onClick={() => onVote(commentId, 1)}
                  />
                  <span className="text-xs font-bold text-base-content/50 px-0.5 tabular-nums min-w-[20px] text-center">
                    {comment.score ?? 0}
                  </span>
                  <VoteButton
                    direction="down"
                    active={comment.userVote === -1}
                    count={comment.downvotes || 0}
                    onClick={() => onVote(commentId, -1)}
                  />
                </div>

                {/* Reply button */}
                <button
                  onClick={() => setReplying((r) => !r)}
                  className="flex items-center gap-1 text-[11px] text-base-content/40 hover:text-primary transition-colors"
                >
                  <MessageSquare className="size-3" />
                  Reply
                </button>

                {/* Delete (own comments only) */}
                {currentUserId &&
                  (comment.authorId?._id?.toString() || comment.authorId?.toString()) ===
                    currentUserId && (
                    <button
                      onClick={() => onDelete(commentId)}
                      className="flex items-center gap-1 text-[11px] text-base-content/30 hover:text-error transition-colors ml-auto"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  )}
              </div>
            )}

            {/* Reply input */}
            {replying && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReplySubmit();
                    }
                    if (e.key === "Escape") setReplying(false);
                  }}
                  placeholder="Write a reply…"
                  className="flex-1 bg-base-200/50 border border-base-content/10 rounded-lg px-3 py-1.5 text-sm text-base-content placeholder:text-base-content/30 focus:outline-none focus:border-primary/40"
                  autoFocus
                />
                <button
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || isSendingComment}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 transition-colors"
                >
                  <Send className="size-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

const VirtualizedThread = ({ postId, onBack }) => {
  const parentRef = useRef(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [isComposerFocused, setIsComposerFocused] = useState(false);

  const post = useThreadStore((s) => s.post);
  const flatComments = useThreadStore((s) => s.flatComments);
  const isLoadingPost = useThreadStore((s) => s.isLoadingPost);
  const isLoadingComments = useThreadStore((s) => s.isLoadingComments);
  const isSendingComment = useThreadStore((s) => s.isSendingComment);
  const error = useThreadStore((s) => s.error);
  const loadPost = useThreadStore((s) => s.loadPost);
  const clearThread = useThreadStore((s) => s.clearThread);
  const toggleCollapse = useThreadStore((s) => s.toggleCollapse);
  const voteComment = useThreadStore((s) => s.voteComment);
  const submitComment = useThreadStore((s) => s.submitComment);
  const getCollapsedReplyCount = useThreadStore((s) => s.getCollapsedReplyCount);
  const { useFeedStore: _feedStore } = { useFeedStore: null }; // avoid circular

  const authUser = useAuthStore((s) => s.authUser);
  const currentUserId = authUser?._id?.toString();

  // Load post on mount / postId change
  useEffect(() => {
    loadPost(postId);
    return () => clearThread();
  }, [postId]);

  // Filter hidden comments for the virtualizer
  const visibleComments = flatComments.filter((c) => !c.isHidden);

  // ── @tanstack/react-virtual setup ─────────────────────────────────────────
  const virtualizer = useVirtualizer({
    count: visibleComments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated height per comment row in px
    overscan: 5,            // Render 5 items outside viewport for smooth scroll
  });

  const handleDeleteComment = useCallback(async (commentId) => {
    try {
      const { axiosInstance } = await import("../../lib/axios.jsx");
      await axiosInstance.delete(`/feed/comments/${commentId}`);
      // Mark as deleted in local state using the already-imported flattenCommentTree
      useThreadStore.setState((state) => {
        const newRaw = state.rawComments.map((c) =>
          (c._id?.toString() || c._id) === commentId
            ? { ...c, isDeleted: true, body: "[deleted]", authorId: null }
            : c
        );
        return {
          rawComments: newRaw,
          flatComments: flattenCommentTree(newRaw, state.collapsedSet),
        };
      });
    } catch {
      const toastLib = await import("../../lib/toast");
      toastLib.default.error("Failed to delete comment");
    }
  }, []);

  const handleTopLevelSubmit = async () => {
    if (!newCommentText.trim()) return;
    await submitComment(newCommentText.trim(), null);
    setNewCommentText("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoadingPost) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-base-content/50 p-8">
        <AlertCircle className="size-8" />
        <p className="text-sm">{error}</p>
        <button
          onClick={onBack}
          className="text-sm text-primary hover:underline"
        >
          Back to feed
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-base-content/8 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-base-content/8 transition-colors text-base-content/60 hover:text-base-content"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0">
          <h2 className="font-semibold text-sm text-base-content truncate">
            {post?.title || "Thread"}
          </h2>
          <p className="text-xs text-base-content/40">
            {post?.commentCount ?? 0} comment{post?.commentCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* ── Post Body ───────────────────────────────────────────────────────── */}
      {post && (
        <div className="px-4 py-3 border-b border-base-content/8 flex-shrink-0">
          {post.body && (
            <p className="text-sm text-base-content/70 leading-relaxed line-clamp-4 mb-2">
              {post.body}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-base-content/40">
            <span className="font-bold text-base-content/60">
              {post.score > 0 ? "+" : ""}{post.score} points
            </span>
            <span>{post.authorId?.username}</span>
          </div>
        </div>
      )}

      {/* ── Comment Composer ────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-base-content/8 flex-shrink-0">
        <div
          className={`flex gap-2 rounded-xl border transition-colors ${
            isComposerFocused
              ? "border-primary/40 bg-primary/5"
              : "border-base-content/10 bg-base-200/40"
          }`}
        >
          <textarea
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onFocus={() => setIsComposerFocused(true)}
            onBlur={() => setIsComposerFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleTopLevelSubmit();
              }
            }}
            placeholder="Add a comment… (Ctrl+Enter to submit)"
            rows={isComposerFocused ? 3 : 1}
            className="flex-1 bg-transparent resize-none px-3 py-2.5 text-sm text-base-content placeholder:text-base-content/30 focus:outline-none"
          />
          <button
            onClick={handleTopLevelSubmit}
            disabled={!newCommentText.trim() || isSendingComment}
            className="self-end mb-2 mr-2 p-1.5 rounded-lg bg-primary text-primary-content disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {isSendingComment ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Virtualized Comment List ─────────────────────────────────────────── */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-2"
      >
        {isLoadingComments ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-primary/50" />
          </div>
        ) : visibleComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-base-content/30 gap-2">
            <MessageSquare className="size-8 opacity-30" />
            <p className="text-sm">No comments yet. Be the first!</p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const comment = visibleComments[virtualRow.index];
              return (
                <div
                  key={comment._id?.toString() || comment._id || virtualRow.index}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <CommentRow
                    comment={comment}
                    onToggleCollapse={toggleCollapse}
                    onVote={voteComment}
                    onDelete={handleDeleteComment}
                    currentUserId={currentUserId}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualizedThread;
