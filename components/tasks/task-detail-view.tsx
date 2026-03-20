"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CommentsSection } from "@/components/tasks/comments-section";
import { TimeTrackingPanel } from "@/components/tasks/time-tracking-panel";
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Plus,
  X,
  MessageSquare,
  Timer,
  Activity,
} from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { formatDate, formatRelativeTime, getInitials, cn } from "@/lib/utils";

interface TaskDetailViewProps {
  task: any;
  orgId: string;
  projectId: string;
  currentUserId?: string;
  onUpdate: (taskId: string, values: any) => void;
  onClose: () => void;
}

export function TaskDetailView({
  task,
  orgId,
  projectId,
  currentUserId,
  onUpdate,
  onClose,
}: TaskDetailViewProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  const isDone = task.status === "DONE";
  const priorityConfig = TASK_PRIORITIES.find(
    (p) => p.value === task.priority
  );
  const statusConfig = TASK_STATUSES.find((s) => s.value === task.status);

  function handleSaveTitle() {
    if (title.trim() && title !== task.title) {
      onUpdate(task.id, { title: title.trim() });
    }
    setIsEditingTitle(false);
  }

  function handleSaveDescription() {
    if (description !== task.description) {
      onUpdate(task.id, { description: description || null });
    }
    setIsEditingDesc(false);
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Status Toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            onUpdate(task.id, { status: isDone ? "TODO" : "DONE" })
          }
        >
          {isDone ? (
            <CheckCircle2 className="h-6 w-6 text-green-500" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground hover:text-foreground" />
          )}
        </button>
        {isEditingTitle ? (
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveTitle();
              if (e.key === "Escape") {
                setTitle(task.title);
                setIsEditingTitle(false);
              }
            }}
            autoFocus
            className="text-lg font-semibold"
          />
        ) : (
          <h2
            onClick={() => setIsEditingTitle(true)}
            className={`cursor-text text-lg font-semibold ${
              isDone ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </h2>
        )}
      </div>

      {/* Properties */}
      <div className="space-y-3">
        {/* Status */}
        <div className="flex items-center gap-4">
          <div className="w-24 text-sm text-muted-foreground">Status</div>
          <Select
            value={task.status}
            onValueChange={(v) => onUpdate(task.id, { status: v })}
          >
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
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

        {/* Priority */}
        <div className="flex items-center gap-4">
          <div className="w-24 text-sm text-muted-foreground">Priority</div>
          <Select
            value={task.priority}
            onValueChange={(v) => onUpdate(task.id, { priority: v })}
          >
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  <div className="flex items-center gap-2">
                    <span>{p.icon}</span>
                    {p.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Assignees */}
        <div className="flex items-start gap-4">
          <div className="w-24 pt-1 text-sm text-muted-foreground">
            Assignees
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {task.assignments?.map((a: any) => (
              <div
                key={a.id}
                className="flex items-center gap-2 rounded-full border px-2 py-1"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={a.member.user.image ?? ""} />
                  <AvatarFallback className="text-[9px]">
                    {a.member.user.name
                      ? getInitials(a.member.user.name)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs">
                  {a.member.user.name || a.member.user.email}
                </span>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Assign
            </Button>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-4">
          <div className="w-24 text-sm text-muted-foreground">Due Date</div>
          {task.dueDate ? (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{formatDate(task.dueDate)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onUpdate(task.id, { dueDate: null })}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Set due date
            </Button>
          )}
        </div>

        {/* Labels */}
        <div className="flex items-start gap-4">
          <div className="w-24 pt-1 text-sm text-muted-foreground">Labels</div>
          <div className="flex flex-wrap items-center gap-1">
            {task.labels?.map((l: any) => (
              <Badge
                key={l.label.id}
                variant="secondary"
                className="gap-1"
                style={{
                  backgroundColor: l.label.color + "20",
                  color: l.label.color,
                  borderColor: l.label.color,
                }}
              >
                {l.label.name}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Plus className="h-3 w-3" />
              Add label
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Description */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Description</h3>
          {!isEditingDesc && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingDesc(true)}
            >
              Edit
            </Button>
          )}
        </div>
        {isEditingDesc ? (
          <div className="space-y-2">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="min-h-[100px]"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveDescription}>
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDescription(task.description || "");
                  setIsEditingDesc(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditingDesc(true)}
            className="cursor-text rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:border-foreground/30"
          >
            {task.description || "Click to add a description..."}
          </div>
        )}
      </div>

      {/* Sub-tasks */}
      {task.subTasks?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">
            Sub-tasks ({task.subTasks.length})
          </h3>
          <div className="space-y-1">
            {task.subTasks.map((sub: any) => (
              <div
                key={sub.id}
                className="flex items-center gap-2 rounded-md border p-2"
              >
                {sub.status === "DONE" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={`flex-1 text-sm ${
                    sub.status === "DONE"
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {sub.title}
                </span>
                {sub.assignments?.length > 0 && (
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={sub.assignments[0].member.user.image ?? ""}
                    />
                    <AvatarFallback className="text-[9px]">
                      {sub.assignments[0].member.user.name
                        ? getInitials(sub.assignments[0].member.user.name)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Comments & Time Tracking Tabs */}
      <Tabs defaultValue="comments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comments" className="gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            Comments ({task.comments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="time" className="gap-1">
            <Timer className="h-3.5 w-3.5" />
            Time
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1">
            <Activity className="h-3.5 w-3.5" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments">
          <CommentsSection
            orgId={orgId}
            taskId={task.id}
            comments={task.comments || []}
            currentUserId={currentUserId || ""}
          />
        </TabsContent>

        <TabsContent value="time">
          <TimeTrackingPanel orgId={orgId} taskId={task.id} />
        </TabsContent>

        <TabsContent value="activity">
          {task.activities?.length > 0 ? (
            <div className="space-y-2">
              {task.activities.slice(0, 20).map((activity: any) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-2 text-xs text-muted-foreground"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={activity.user?.image ?? ""} />
                    <AvatarFallback className="text-[8px]">
                      {activity.user?.name
                        ? getInitials(activity.user.name)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    <strong className="font-medium text-foreground">
                      {activity.user?.name || "Someone"}
                    </strong>{" "}
                    {activity.type.replace(/_/g, " ").toLowerCase()}
                  </span>
                  <span className="ml-auto">
                    {formatRelativeTime(activity.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity yet.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
