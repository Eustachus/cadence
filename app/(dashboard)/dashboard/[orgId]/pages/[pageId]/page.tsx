"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Save,
  Clock,
  MessageSquare,
  History,
  Globe,
  Lock,
} from "lucide-react";
import { getPage, updatePage, addPageComment } from "@/actions/pages";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { toast } from "sonner";

export default function PageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const pageId = params.pageId as string;

  const [page, setPage] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPage();
  }, [orgId, pageId]);

  async function loadPage() {
    setIsLoading(true);
    try {
      const data = await getPage(orgId, pageId);
      setPage(data);
      setTitle(data?.title || "");
      const contentObj = data?.content as any;
      setContent(
        typeof contentObj === "string"
          ? contentObj
          : contentObj?.content?.[0]?.content?.[0]?.text || ""
      );
    } catch {
      toast.error("Failed to load page");
    }
    setIsLoading(false);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updatePage(orgId, pageId, {
        title,
        content: {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: content }],
            },
          ],
        },
      });
      toast.success("Page saved!");
      setIsEditing(false);
      loadPage();
    } catch {
      toast.error("Failed to save");
    }
    setIsSaving(false);
  }

  async function handleAddComment() {
    if (!commentText.trim()) return;
    try {
      await addPageComment(orgId, pageId, commentText);
      setCommentText("");
      loadPage();
    } catch {
      toast.error("Failed to add comment");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Page not found</h2>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/dashboard/${orgId}/pages`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pages
        </Button>
        <div className="flex items-center gap-2">
          {page.isPublic ? (
            <Badge variant="outline" className="gap-1">
              <Globe className="h-3 w-3" />
              Public
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <Lock className="h-3 w-3" />
              Private
            </Badge>
          )}
          {isEditing ? (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Title */}
      {isEditing ? (
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-0 px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
          placeholder="Page title..."
        />
      ) : (
        <h1 className="text-3xl font-bold">{page.title}</h1>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {page.creator && (
          <div className="flex items-center gap-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={page.creator.image ?? ""} />
              <AvatarFallback className="text-[9px]">
                {page.creator.name ? getInitials(page.creator.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <span>{page.creator.name}</span>
          </div>
        )}
        <span>•</span>
        <Clock className="h-3 w-3" />
        <span>Updated {formatRelativeTime(page.updatedAt)}</span>
      </div>

      <Separator />

      {/* Content */}
      <div className="min-h-[200px]">
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[300px] resize-none border-0 p-0 shadow-none focus-visible:ring-0"
            placeholder="Start writing..."
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {content ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <p className="text-muted-foreground italic">
                This page is empty. Click Edit to add content.
              </p>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Child Pages */}
      {page.children?.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
            Sub-pages ({page.children.length})
          </h3>
          <div className="space-y-2">
            {page.children.map((child: any) => (
              <Link
                key={child.id}
                href={`/dashboard/${orgId}/pages/${child.id}`}
                className="flex items-center gap-2 rounded-lg border p-3 hover:bg-muted/50"
              >
                <span className="text-sm font-medium">{child.title}</span>
                {child._count.children > 0 && (
                  <Badge variant="secondary">{child._count.children}</Badge>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          Comments ({page.comments?.length || 0})
        </h3>
        <div className="space-y-3">
          {page.comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author?.image ?? ""} />
                <AvatarFallback className="text-xs">
                  {comment.author?.name
                    ? getInitials(comment.author.name)
                    : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {comment.author?.name || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Textarea
            placeholder="Write a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[60px]"
          />
          <Button
            size="sm"
            className="self-end"
            onClick={handleAddComment}
            disabled={!commentText.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
