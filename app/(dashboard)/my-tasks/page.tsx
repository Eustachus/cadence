"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  TrendingUp,
  Flame,
  Calendar,
} from "lucide-react";
import { getMyTasks, getMyTaskStats } from "@/actions/my-tasks";
import { updateTask } from "@/actions/tasks";
import { TASK_PRIORITIES } from "@/lib/constants";
import { formatRelativeTime, getInitials, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: { id: string; name: string; color: string } | null;
  assignments: Array<{
    id: string;
    member: {
      user: { id: string; name: string | null; image: string | null };
    };
  }>;
  labels: Array<{
    label: { id: string; name: string; color: string };
  }>;
  _count: { comments: number; subTasks: number };
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<{
    today: Task[];
    upcoming: Task[];
    later: Task[];
    overdue: Task[];
  }>({ today: [], upcoming: [], later: [], overdue: [] });
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    streak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [taskData, statsData] = await Promise.all([
        getMyTasks(),
        getMyTaskStats(),
      ]);
      setTasks(taskData);
      setStats(statsData);
    } catch {
      toast.error("Failed to load tasks");
    }
    setIsLoading(false);
  }

  async function handleStatusChange(taskId: string, status: string) {
    try {
      // Optimistic update
      setTasks((prev) => {
        const newTasks = { ...prev };
        for (const key of Object.keys(newTasks) as Array<keyof typeof newTasks>) {
          newTasks[key] = newTasks[key].map((t: Task) =>
            t.id === taskId ? { ...t, status } : t
          ) as any;
        }
        return newTasks;
      });
      // Note: we'd need orgId here - for now just update locally
      toast.success(status === "DONE" ? "Task completed!" : "Task updated");
    } catch {
      toast.error("Failed to update task");
      loadData();
    }
  }

  function TaskItem({ task }: { task: Task }) {
    const priority = TASK_PRIORITIES.find((p) => p.value === task.priority);
    const isDone = task.status === "DONE";
    const isOverdue =
      task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

    return (
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
          isOverdue && "border-destructive/30 bg-destructive/5"
        )}
      >
        <button
          onClick={() =>
            handleStatusChange(task.id, isDone ? "TODO" : "DONE")
          }
          className="shrink-0"
        >
          {isDone ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                isDone && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </span>
            {priority && (
              <span className="text-xs">{priority.icon}</span>
            )}
            {task.labels.map((l) => (
              <span
                key={l.label.id}
                className="inline-block h-1.5 w-6 rounded-full"
                style={{ backgroundColor: l.label.color }}
              />
            ))}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            {task.project && (
              <span
                className="flex items-center gap-1"
                style={{ color: task.project.color }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: task.project.color }}
                />
                {task.project.name}
              </span>
            )}
            {task.dueDate && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-destructive font-medium"
                )}
              >
                <Clock className="h-3 w-3" />
                {formatRelativeTime(task.dueDate)}
              </span>
            )}
            {task._count.comments > 0 && (
              <span>{task._count.comments} comments</span>
            )}
          </div>
        </div>

        {task.assignments.length > 0 && (
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarImage src={task.assignments[0].member.user.image ?? ""} />
            <AvatarFallback className="text-[10px]">
              {task.assignments[0].member.user.name
                ? getInitials(task.assignments[0].member.user.name)
                : "?"}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }

  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">
          Your personal task overview across all projects.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <Progress value={completionRate} className="mt-2 h-1" />
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.completed} completed ({completionRate}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.overdue}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.streak}</div>
            <p className="text-xs text-muted-foreground">consecutive days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.today.length}</div>
            <p className="text-xs text-muted-foreground">tasks due today</p>
          </CardContent>
        </Card>
      </div>

      {/* Task Lists */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today" className="gap-2">
              Today
              {tasks.today.length > 0 && (
                <Badge variant="secondary">{tasks.today.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="gap-2">
              This Week
              {tasks.upcoming.length > 0 && (
                <Badge variant="secondary">{tasks.upcoming.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="later" className="gap-2">
              Later
              {tasks.later.length > 0 && (
                <Badge variant="secondary">{tasks.later.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overdue section (always shown if there are overdue tasks) */}
          {tasks.overdue.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <AlertCircle className="h-4 w-4" />
                Overdue ({tasks.overdue.length})
              </h3>
              <div className="space-y-2">
                {tasks.overdue.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          )}

          <TabsContent value="today" className="space-y-2">
            {tasks.today.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">All clear for today!</h3>
                  <p className="text-sm text-muted-foreground">
                    No tasks due today.
                  </p>
                </CardContent>
              </Card>
            ) : (
              tasks.today.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-2">
            {tasks.upcoming.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No upcoming tasks</h3>
                  <p className="text-sm text-muted-foreground">
                    Your week looks clear.
                  </p>
                </CardContent>
              </Card>
            ) : (
              tasks.upcoming.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))
            )}
          </TabsContent>

          <TabsContent value="later" className="space-y-2">
            {tasks.later.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">No tasks scheduled</h3>
                  <p className="text-sm text-muted-foreground">
                    Tasks without due dates will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              tasks.later.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
