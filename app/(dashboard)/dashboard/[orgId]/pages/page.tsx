"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  Globe,
  Lock,
  MessageSquare,
} from "lucide-react";
import { getPages, createPage, deletePage } from "@/actions/pages";
import { formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";

interface PageItem {
  id: string;
  title: string;
  icon: string | null;
  isPublic: boolean;
  updatedAt: Date;
  creator: { id: string; name: string | null; image: string | null } | null;
  children: PageItem[];
  _count: { children: number; comments: number };
}

export default function PagesPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPages();
  }, [orgId]);

  async function loadPages() {
    setIsLoading(true);
    try {
      const data = await getPages(orgId);
      setPages(data as any);
    } catch {
      toast.error("Failed to load pages");
    }
    setIsLoading(false);
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const result = await createPage(orgId, {
        title: newTitle,
        content: { type: "doc", content: [] },
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Page created!");
        setNewTitle("");
        setIsCreateOpen(false);
        loadPages();
      }
    } catch {
      toast.error("Failed to create page");
    }
    setIsSubmitting(false);
  }

  async function handleDelete(pageId: string) {
    if (!confirm("Delete this page?")) return;
    try {
      await deletePage(orgId, pageId);
      toast.success("Page deleted");
      loadPages();
    } catch {
      toast.error("Failed to delete page");
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function PageRow({ page, depth = 0 }: { page: PageItem; depth?: number }) {
    const isExpanded = expandedIds.has(page.id);
    const hasChildren = page.children?.length > 0;

    return (
      <div>
        <div
          className={cn(
            "group flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50",
            depth > 0 && "ml-6 border-l-2"
          )}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(page.id)}
              className="shrink-0 text-muted-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />

          <Link
            href={`/dashboard/${orgId}/pages/${page.id}`}
            className="min-w-0 flex-1"
          >
            <span className="font-medium">{page.title}</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {page.isPublic ? (
                <Globe className="h-3 w-3" />
              ) : (
                <Lock className="h-3 w-3" />
              )}
              <span>Updated {formatRelativeTime(page.updatedAt)}</span>
              {page._count.comments > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {page._count.comments}
                </span>
              )}
            </div>
          </Link>

          {page._count.children > 0 && (
            <Badge variant="secondary" className="shrink-0">
              {page._count.children} pages
            </Badge>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/${orgId}/pages/${page.id}`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(page.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1">
            {page.children.map((child) => (
              <PageRow key={child.id} page={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages</h1>
          <p className="text-muted-foreground">
            Create docs, wikis, and knowledge bases.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Page
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a page</DialogTitle>
              <DialogDescription>
                Start with a blank page or choose a template.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Page title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !newTitle.trim()}
                className="w-full"
              >
                Create page
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No pages yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first page to get started.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {pages.map((page) => (
            <PageRow key={page.id} page={page} />
          ))}
        </div>
      )}
    </div>
  );
}
