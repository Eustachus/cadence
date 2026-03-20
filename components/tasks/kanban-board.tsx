"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { TaskColumn } from "./task-column";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { createTask, updateTask } from "@/actions/tasks";
import { createSection } from "@/actions/projects";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  tasks: Task[];
}

interface KanbanBoardProps {
  orgId: string;
  projectId: string;
  sections: Section[];
  onTaskClick: (taskId: string) => void;
}

export function KanbanBoard({
  orgId,
  projectId,
  sections: initialSections,
  onTaskClick,
}: KanbanBoardProps) {
  const [sections, setSections] = useState(initialSections);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState<Record<string, string>>({});
  const [isAddingTask, setIsAddingTask] = useState<Record<string, boolean>>({});
  const [newSectionName, setNewSectionName] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = sections
      .flatMap((s) => s.tasks)
      .find((t) => t.id === active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find which section the active task is in
    const activeSection = sections.find((s) =>
      s.tasks.some((t) => t.id === activeId)
    );
    const overSection = sections.find(
      (s) =>
        s.id === overId || s.tasks.some((t) => t.id === overId)
    );

    if (!activeSection || !overSection) return;
    if (activeSection.id === overSection.id) return;

    // Moving between sections
    setSections((prev) => {
      const activeIdx = prev.findIndex((s) => s.id === activeSection.id);
      const overIdx = prev.findIndex((s) => s.id === overSection.id);
      const taskIdx = prev[activeIdx].tasks.findIndex((t) => t.id === activeId);
      const task = prev[activeIdx].tasks[taskIdx];

      const newSections = [...prev];
      newSections[activeIdx] = {
        ...newSections[activeIdx],
        tasks: newSections[activeIdx].tasks.filter((t) => t.id !== activeId),
      };

      const overTaskIdx = newSections[overIdx].tasks.findIndex(
        (t) => t.id === overId
      );
      const insertIdx = overTaskIdx === -1 ? newSections[overIdx].tasks.length : overTaskIdx;

      newSections[overIdx] = {
        ...newSections[overIdx],
        tasks: [
          ...newSections[overIdx].tasks.slice(0, insertIdx),
          { ...task, sectionId: overSection.id },
          ...newSections[overIdx].tasks.slice(insertIdx),
        ],
      };

      return newSections;
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeSection = sections.find((s) =>
      s.tasks.some((t) => t.id === activeId)
    );
    const overSection = sections.find(
      (s) =>
        s.id === overId || s.tasks.some((t) => t.id === overId)
    );

    if (!activeSection || !overSection) return;

    // Save to server
    try {
      await updateTask(orgId, projectId, activeId, {
        sectionId: overSection.id,
        position: overSection.tasks.findIndex((t) => t.id === activeId) + 1,
      });
    } catch {
      toast.error("Failed to move task");
    }
  }

  async function handleAddTask(sectionId: string) {
    const title = newTaskTitle[sectionId]?.trim();
    if (!title) return;

    setIsAddingTask((p) => ({ ...p, [sectionId]: true }));
    try {
      const result = await createTask(orgId, projectId, {
        title,
        sectionId,
      });
      if (result.error) {
        toast.error(result.error);
      } else if (result.task) {
        setSections((prev) =>
          prev.map((s) =>
            s.id === sectionId
              ? { ...s, tasks: [...s.tasks, result.task as any] }
              : s
          )
        );
        setNewTaskTitle((p) => ({ ...p, [sectionId]: "" }));
      }
    } catch {
      toast.error("Failed to create task");
    }
    setIsAddingTask((p) => ({ ...p, [sectionId]: false }));
  }

  async function handleAddSection() {
    if (!newSectionName.trim()) return;
    setIsLoading(true);
    try {
      const result = await createSection(orgId, projectId, newSectionName);
      if (result.success && result.section) {
        setSections((prev) => [
          ...prev,
          { ...result.section, tasks: [] } as any,
        ]);
        setNewSectionName("");
        setIsAddingSection(false);
      }
    } catch {
      toast.error("Failed to add section");
    }
    setIsLoading(false);
  }

  async function handleStatusChange(taskId: string, status: string) {
    try {
      await updateTask(orgId, projectId, taskId, { status });
      setSections((prev) =>
        prev.map((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status } : t
          ),
        }))
      );
    } catch {
      toast.error("Failed to update task");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {sections.map((section) => (
          <TaskColumn
            key={section.id}
            section={section}
            tasks={section.tasks}
            onTaskClick={onTaskClick}
            onStatusChange={handleStatusChange}
            newTaskTitle={newTaskTitle[section.id] || ""}
            onNewTaskTitleChange={(title) =>
              setNewTaskTitle((p) => ({ ...p, [section.id]: title }))
            }
            onAddTask={() => handleAddTask(section.id)}
            isAddingTask={isAddingTask[section.id] || false}
          />
        ))}

        {/* Add Section */}
        <div className="w-72 shrink-0">
          {isAddingSection ? (
            <div className="rounded-lg border bg-card p-3">
              <Input
                placeholder="Section name"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSection();
                  if (e.key === "Escape") setIsAddingSection(false);
                }}
              />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddSection}
                  disabled={isLoading || !newSectionName.trim()}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  )}
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsAddingSection(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsAddingSection(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add section
            </Button>
          )}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isOverlay onStatusChange={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
