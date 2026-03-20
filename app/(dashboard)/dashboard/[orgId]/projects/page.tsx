"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Star,
  StarOff,
  Archive,
  Copy,
  FolderKanban,
  Calendar,
  Loader2,
} from "lucide-react";
import {
  createProject,
  getProjects,
  deleteProject,
  duplicateProject,
  archiveProject,
  toggleFavorite,
} from "@/actions/projects";
import { PROJECT_STATUSES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  status: string;
  isPublic: boolean;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  startDate: Date | null;
  endDate: Date | null;
  organizationId: string;
  teamId: string | null;
  team: { id: string; name: string; color: string } | null;
  sections: Array<{ id: string; name: string; position: number }>;
  _count: { tasks: number };
  createdAt: Date;
  updatedAt: Date;
}

export default function ProjectsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    icon: "folder",
    status: "ON_TRACK" as string,
    isPublic: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [orgId, showArchived]);

  async function loadProjects() {
    setIsLoading(true);
    try {
      const data = await getProjects(orgId, showArchived);
      setProjects(data as Project[]);
    } catch {
      toast.error("Failed to load projects");
    }
    setIsLoading(false);
  }

  async function handleCreate() {
    setIsSubmitting(true);
    try {
      const result = await createProject(orgId, {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        icon: formData.icon,
        status: formData.status as any,
        isPublic: formData.isPublic,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Project created!");
        setIsCreateOpen(false);
        setFormData({
          name: "",
          description: "",
          color: "#6366f1",
          icon: "folder",
          status: "ON_TRACK",
          isPublic: true,
        });
        loadProjects();
      }
    } catch {
      toast.error("Failed to create project");
    }
    setIsSubmitting(false);
  }

  async function handleDelete(projectId: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      await deleteProject(orgId, projectId);
      toast.success("Project deleted");
      loadProjects();
    } catch {
      toast.error("Failed to delete project");
    }
  }

  async function handleDuplicate(projectId: string) {
    try {
      const result = await duplicateProject(orgId, projectId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Project duplicated!");
        loadProjects();
      }
    } catch {
      toast.error("Failed to duplicate project");
    }
  }

  async function handleArchive(projectId: string, archive: boolean) {
    try {
      await archiveProject(orgId, projectId, archive);
      toast.success(archive ? "Project archived" : "Project restored");
      loadProjects();
    } catch {
      toast.error("Failed to update project");
    }
  }

  async function handleToggleFavorite(projectId: string) {
    try {
      await toggleFavorite(orgId, projectId);
      loadProjects();
    } catch {
      toast.error("Failed to update favorite");
    }
  }

  const statusConfig = PROJECT_STATUSES[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage your workspace projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {showArchived ? "Active" : "Archived"}
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create a project</DialogTitle>
                <DialogDescription>
                  Set up a new project to organize your tasks.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="project-name">Name</Label>
                  <Input
                    id="project-name"
                    placeholder="Project name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-desc">Description</Label>
                  <Textarea
                    id="project-desc"
                    placeholder="Brief description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) =>
                        setFormData((f) => ({ ...f, status: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: s.color }}
                              />
                              {s.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"].map((c) => (
                        <button
                          key={c}
                          type="button"
                          className={`h-7 w-7 rounded-full border-2 ${
                            formData.color === c
                              ? "border-foreground scale-110"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: c }}
                          onClick={() =>
                            setFormData((f) => ({ ...f, color: c }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={isSubmitting || !formData.name}
                  className="w-full"
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create project
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              {showArchived ? "No archived projects" : "No projects yet"}
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {showArchived
                ? "Archived projects will appear here."
                : "Create your first project to get started."}
            </p>
            {!showArchived && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const status = PROJECT_STATUSES.find(
              (s) => s.value === project.status
            );
            return (
              <Card
                key={project.id}
                className="group transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Link
                      href={`/dashboard/${orgId}/projects/${project.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: project.color + "20" }}
                        >
                          <FolderKanban
                            className="h-5 w-5"
                            style={{ color: project.color }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate text-lg">
                            {project.name}
                          </CardTitle>
                          {project.description && (
                            <CardDescription className="mt-0.5 truncate">
                              {project.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleToggleFavorite(project.id)}
                      >
                        {project.isFavorite ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/dashboard/${orgId}/projects/${project.id}`
                              )
                            }
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(project.id)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleArchive(project.id, !project.isArchived)
                            }
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            {project.isArchived ? "Restore" : "Archive"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(project.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {status && (
                        <Badge
                          variant="outline"
                          className="gap-1"
                          style={{
                            borderColor: status.color,
                            color: status.color,
                          }}
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          {status.label}
                        </Badge>
                      )}
                      {project.team && (
                        <Badge variant="secondary">{project.team.name}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FolderKanban className="h-3 w-3" />
                      {project._count.tasks} tasks
                    </div>
                  </div>
                  {project.endDate && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Due {formatDate(project.endDate)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
