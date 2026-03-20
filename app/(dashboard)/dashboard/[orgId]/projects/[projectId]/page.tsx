"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import { ListView } from "@/components/tasks/list-view";
import { CalendarView } from "@/components/tasks/calendar-view";
import { TimelineView } from "@/components/tasks/timeline-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  MoreVertical,
  LayoutList,
  Columns3,
  Calendar,
  Loader2,
} from "lucide-react";
import { getProject } from "@/actions/projects";
import { getTask, updateTask } from "@/actions/tasks";
import { TaskDetailView } from "@/components/tasks/task-detail-view";
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
  startDate: Date | null;
  endDate: Date | null;
  organizationId: string;
  teamId: string | null;
  team: { id: string; name: string; color: string } | null;
  sections: Array<{
    id: string;
    name: string;
    position: number;
    tasks: any[];
  }>;
  tasks: any[];
  _count: { tasks: number };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTask, setIsLoadingTask] = useState(false);

  useEffect(() => {
    loadProject();
  }, [orgId, projectId]);

  useEffect(() => {
    if (selectedTaskId) {
      loadTask(selectedTaskId);
    } else {
      setSelectedTask(null);
    }
  }, [selectedTaskId]);

  async function loadProject() {
    setIsLoading(true);
    try {
      const data = await getProject(orgId, projectId);
      setProject(data as Project);
    } catch {
      toast.error("Failed to load project");
    }
    setIsLoading(false);
  }

  async function loadTask(taskId: string) {
    setIsLoadingTask(true);
    try {
      const data = await getTask(orgId, taskId);
      setSelectedTask(data);
    } catch {
      toast.error("Failed to load task");
    }
    setIsLoadingTask(false);
  }

  async function handleTaskUpdate(taskId: string, values: any) {
    try {
      await updateTask(orgId, projectId, taskId, values);
      loadProject();
      if (selectedTaskId === taskId) {
        loadTask(taskId);
      }
    } catch {
      toast.error("Failed to update task");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-72" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold">Project not found</h2>
        <Button variant="link" onClick={() => router.back()}>
          Go back
        </Button>
      </div>
    );
  }

  const status = PROJECT_STATUSES.find((s) => s.value === project.status);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/${orgId}/projects`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: project.color + "20" }}
          >
            <div
              className="h-5 w-5 rounded"
              style={{ backgroundColor: project.color }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2">
              {status && (
                <Badge
                  variant="outline"
                  style={{ borderColor: status.color, color: status.color }}
                >
                  {status.label}
                </Badge>
              )}
              {project.team && (
                <Badge variant="secondary">{project.team.name}</Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {project._count.tasks} tasks
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board" className="gap-2">
            <Columns3 className="h-4 w-4" />
            Board
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <LayoutList className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <Calendar className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-0">
          <KanbanBoard
            orgId={orgId}
            projectId={projectId}
            sections={project.sections}
            onTaskClick={setSelectedTaskId}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-0">
          <ListView
            tasks={project.tasks}
            onTaskClick={setSelectedTaskId}
            onStatusChange={(taskId, status) =>
              handleTaskUpdate(taskId, { status })
            }
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <TimelineView
            tasks={project.tasks}
            onTaskClick={setSelectedTaskId}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-0">
          <CalendarView
            tasks={project.tasks}
            onTaskClick={setSelectedTaskId}
          />
        </TabsContent>
      </Tabs>

      {/* Task Detail Sheet */}
      <Sheet
        open={!!selectedTaskId}
        onOpenChange={(open) => !open && setSelectedTaskId(null)}
      >
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Task Details</SheetTitle>
          </SheetHeader>
          {isLoadingTask ? (
            <div className="mt-4 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-8 w-32" />
            </div>
          ) : selectedTask ? (
            <TaskDetailView
              task={selectedTask}
              orgId={orgId}
              projectId={projectId}
              onUpdate={handleTaskUpdate}
              onClose={() => setSelectedTaskId(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
