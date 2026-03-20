"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Paperclip,
  AlertCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Minus,
} from "lucide-react";
import { TASK_PRIORITIES } from "@/lib/constants";
import { formatRelativeTime, getInitials } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  position: number;
  dueDate: Date | null;
  sectionId: string | null;
  assignments: Array<{
    id: string;
    member: {
      id: string;
      user: { id: string; name: string | null; image: string | null };
    };
  }>;
  labels: Array<{
    label: { id: string; name: string; color: string };
  }>;
  _count: { comments: number; subTasks: number; attachments: number };
}

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
  onClick?: () => void;
  onStatusChange?: (status: string) => void;
}

const priorityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  URGENT: AlertCircle,
  HIGH: ArrowUp,
  MEDIUM: ArrowRight,
  LOW: ArrowDown,
  NONE: Minus,
};

const priorityColors: Record<string, string> = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-green-500",
  NONE: "text-muted-foreground",
};

export function TaskCard({
  task,
  isOverlay,
  onClick,
  onStatusChange,
}: TaskCardProps) {
  const PriorityIcon = priorityIcons[task.priority] || Minus;
  const priorityColor = priorityColors[task.priority] || "text-muted-foreground";
  const isDone = task.status === "DONE";
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !isDone;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md",
        isOverlay && "shadow-lg rotate-2",
        isDone && "opacity-60"
      )}
    >
      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {task.labels.map((l) => (
            <span
              key={l.label.id}
              className="inline-block h-1.5 w-8 rounded-full"
              style={{ backgroundColor: l.label.color }}
              title={l.label.name}
            />
          ))}
        </div>
      )}

      {/* Title */}
      <div className="flex items-start gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange?.(isDone ? "TODO" : "DONE");
          }}
          className="mt-0.5 shrink-0"
        >
          {isDone ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          )}
        </button>
        <h4
          className={cn(
            "flex-1 text-sm font-medium leading-tight",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </h4>
        <PriorityIcon className={cn("h-3.5 w-3.5 shrink-0", priorityColor)} />
      </div>

      {/* Meta */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}
          {task._count.attachments > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />
              {task._count.attachments}
            </span>
          )}
          {task._count.subTasks > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {task._count.subTasks}
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assignments.length > 0 && (
          <div className="flex -space-x-1.5">
            {task.assignments.slice(0, 3).map((a) => (
              <Avatar key={a.id} className="h-5 w-5 border border-background">
                <AvatarImage src={a.member.user.image ?? ""} />
                <AvatarFallback className="text-[9px]">
                  {a.member.user.name
                    ? getInitials(a.member.user.name)
                    : "?"}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignments.length > 3 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full border border-background bg-muted text-[9px] font-medium">
                +{task.assignments.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
