"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  MoreHorizontal,
  Edit,
  Trash2,
  Reply,
  Smile,
  Loader2,
} from "lucide-react";
import {
  createComment,
  updateComment,
  deleteComment,
  addReaction,
} from "@/actions/comments";
import { formatRelativeTime, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Reaction {
  id: string;
  emoji: string;
  user: { id: string; name: string | null };
}

interface CommentType {
  id: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: { id: string; name: string | null; image: string | null };
  replies?: CommentType[];
  reactions?: Reaction[];
}

interface CommentsSectionProps {
  orgId: string;
  taskId: string;
  comments: CommentType[];
  currentUserId: string;
}

const QUICK_EMOJIS = ["👍", "❤️", "🎉", "😄", "👀", "🚀"];

export function CommentsSection({
  orgId,
  taskId,
  comments,
  currentUserId,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function handleSubmit() {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment(orgId, taskId, newComment);
      setNewComment("");
      toast.success("Comment added");
      // Reload page to show new comment
      window.location.reload();
    } catch {
      toast.error("Failed to add comment");
    }
    setIsSubmitting(false);
  }

  async function handleReply(parentId: string) {
    if (!replyText.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment(orgId, taskId, replyText, parentId);
      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply added");
      window.location.reload();
    } catch {
      toast.error("Failed to add reply");
    }
    setIsSubmitting(false);
  }

  async function handleEdit(commentId: string) {
    if (!editText.trim()) return;
    try {
      await updateComment(orgId, commentId, editText);
      setEditingId(null);
      toast.success("Comment updated");
      window.location.reload();
    } catch {
      toast.error("Failed to update");
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(orgId, commentId);
      toast.success("Comment deleted");
      window.location.reload();
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function handleReaction(commentId: string, emoji: string) {
    try {
      await addReaction(orgId, commentId, emoji);
    } catch {
      toast.error("Failed to react");
    }
  }

  function CommentItem({
    comment,
    isReply = false,
  }: {
    comment: CommentType;
    isReply?: boolean;
  }) {
    const isAuthor = comment.author.id === currentUserId;
    const groupedReactions = comment.reactions?.reduce(
      (acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], reacted: false };
        acc[r.emoji].count++;
        acc[r.emoji].users.push(r.user.name || "Unknown");
        if (r.user.id === currentUserId) acc[r.emoji].reacted = true;
        return acc;
      },
      {} as Record<string, { count: number; users: string[]; reacted: boolean }>
    );

    return (
      <div className={cn("flex gap-3", isReply && "ml-10")}>
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.author.image ?? ""} />
          <AvatarFallback className="text-xs">
            {comment.author.name ? getInitials(comment.author.name) : "?"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {comment.author.name || "Unknown"}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {comment.updatedAt > comment.createdAt && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {/* Body */}
          {editingId === comment.id ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEdit(comment.id)}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
          )}

          {/* Reactions */}
          {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(groupedReactions).map(([emoji, data]) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(comment.id, emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                    data.reacted
                      ? "border-primary/30 bg-primary/10"
                      : "hover:bg-muted"
                  )}
                  title={data.users.join(", ")}
                >
                  <span>{emoji}</span>
                  <span>{data.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Actions */}
          {editingId !== comment.id && (
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground"
                  >
                    <Smile className="mr-1 h-3 w-3" />
                    React
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="flex gap-1 p-1">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(comment.id, emoji)}
                      className="rounded p-1 text-lg hover:bg-muted"
                    >
                      {emoji}
                    </button>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Reply
                </Button>
              )}

              {isAuthor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditText(comment.body);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply Input */}
          {replyingTo === comment.id && (
            <div className="mt-2 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[60px]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReply(comment.id)}
                  disabled={isSubmitting || !replyText.trim()}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies?.map((reply) => (
            <CommentItem key={reply.id} comment={reply} isReply />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      )}

      <Separator />

      {/* New Comment */}
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback className="text-xs">You</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !newComment.trim()}
              size="sm"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              )}
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
