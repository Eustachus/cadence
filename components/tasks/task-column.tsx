"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortable-item";
import { TaskCard } from "./task-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface Section {
  id: string;
  name: string;
  position: number;
}

interface TaskColumnProps {
  section: Section;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
  newTaskTitle: string;
  onNewTaskTitleChange: (title: string) => void;
  onAddTask: () => void;
  isAddingTask: boolean;
}

export function TaskColumn({
  section,
  tasks,
  onTaskClick,
  onStatusChange,
  newTaskTitle,
  onNewTaskTitleChange,
  onAddTask,
  isAddingTask,
}: TaskColumnProps) {
  const { setNodeRef } = useDroppable({ id: section.id });

  return (
    <div
      ref={setNodeRef}
      className="w-72 shrink-0 rounded-lg border bg-muted/30"
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{section.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Tasks */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 p-2">
          {tasks.map((task) => (
            <SortableItem key={task.id} id={task.id}>
              <TaskCard
                task={task}
                onClick={() => onTaskClick(task.id)}
                onStatusChange={(status) => onStatusChange(task.id, status)}
              />
            </SortableItem>
          ))}
        </div>
      </SortableContext>

      {/* Add Task */}
      <div className="p-2">
        <div className="flex gap-2">
          <Input
            placeholder="Add task..."
            value={newTaskTitle}
            onChange={(e) => onNewTaskTitleChange(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") onAddTask();
            }}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddTask}
            disabled={isAddingTask || !newTaskTitle.trim()}
            className="h-8 w-8 p-0"
          >
            {isAddingTask ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
