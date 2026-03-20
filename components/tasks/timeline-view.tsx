"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { getInitials, formatDate } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  position: number;
  dueDate: Date | null;
  startDate: Date | null;
  sectionId: string | null;
  isMilestone: boolean;
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
}

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

type ZoomLevel = "day" | "week" | "month";

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(d1: Date, d2: Date) {
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }
  return dates;
}

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

function getMonthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  const [zoom, setZoom] = useState<ZoomLevel>("week");
  const [viewStart, setViewStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });

  const today = new Date();

  // Calculate visible date range based on zoom
  const { columns, headerLabels } = useMemo(() => {
    const cols: Date[] = [];
    const labels: Array<{ label: string; span: number; isToday?: boolean }> = [];

    if (zoom === "day") {
      for (let i = 0; i < 30; i++) {
        cols.push(addDays(viewStart, i));
      }
      let currentMonth = -1;
      let span = 0;
      cols.forEach((d, i) => {
        if (d.getMonth() !== currentMonth) {
          if (span > 0) labels.push({ label: `${MONTH_SHORT[currentMonth]} ${cols[i - 1].getFullYear()}`, span });
          currentMonth = d.getMonth();
          span = 1;
        } else {
          span++;
        }
        if (i === cols.length - 1) {
          labels.push({ label: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`, span });
        }
      });
    } else if (zoom === "week") {
      const start = getWeekStart(viewStart);
      for (let i = 0; i < 16; i++) {
        cols.push(addDays(start, i * 7));
      }
      cols.forEach((d) => {
        labels.push({
          label: `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`,
          span: 1,
          isToday: diffDays(d, today) >= 0 && diffDays(d, today) < 7,
        });
      });
    } else {
      for (let i = 0; i < 12; i++) {
        const d = new Date(viewStart.getFullYear(), viewStart.getMonth() + i, 1);
        cols.push(d);
      }
      cols.forEach((d) => {
        labels.push({
          label: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`,
          span: 1,
          isToday: d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
        });
      });
    }

    return { columns: cols, headerLabels: labels };
  }, [viewStart, zoom, today]);

  // Calculate task bar positions
  const taskBars = useMemo(() => {
    return tasks
      .filter((t) => t.startDate || t.dueDate)
      .map((task) => {
        const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate!);
        const end = task.dueDate ? new Date(task.dueDate) : addDays(start, 1);
        const duration = Math.max(diffDays(start, end), 1);

        let left = 0;
        let width = 0;

        if (zoom === "day") {
          left = diffDays(viewStart, start);
          width = duration;
        } else if (zoom === "week") {
          const weekStart = getWeekStart(viewStart);
          left = diffDays(weekStart, start) / 7;
          width = Math.max(duration / 7, 0.5);
        } else {
          const monthStart = getMonthStart(viewStart);
          const monthsFromStart =
            (start.getFullYear() - monthStart.getFullYear()) * 12 +
            (start.getMonth() - monthStart.getMonth()) +
            start.getDate() / 30;
          left = monthsFromStart;
          width = Math.max(duration / 30, 0.3);
        }

        const statusColor =
          TASK_STATUSES.find((s) => s.value === task.status)?.color || "#94a3b8";
        const isDone = task.status === "DONE";

        return {
          task,
          left,
          width,
          statusColor,
          isDone,
          isOverdue: end < today && !isDone,
        };
      });
  }, [tasks, columns, zoom, viewStart, today]);

  const cellWidth = zoom === "day" ? 40 : zoom === "week" ? 80 : 100;
  const totalWidth = columns.length * cellWidth;

  function navigateBack() {
    if (zoom === "day") setViewStart(addDays(viewStart, -14));
    else if (zoom === "week") setViewStart(addDays(viewStart, -56));
    else setViewStart(new Date(viewStart.getFullYear(), viewStart.getMonth() - 6, 1));
  }

  function navigateForward() {
    if (zoom === "day") setViewStart(addDays(viewStart, 14));
    else if (zoom === "week") setViewStart(addDays(viewStart, 56));
    else setViewStart(new Date(viewStart.getFullYear(), viewStart.getMonth() + 6, 1));
  }

  function goToToday() {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    setViewStart(d);
  }

  // Today line position
  const todayPosition = useMemo(() => {
    if (zoom === "day") {
      const pos = diffDays(viewStart, today);
      if (pos < 0 || pos >= columns.length) return null;
      return pos * cellWidth;
    } else if (zoom === "week") {
      const weekStart = getWeekStart(viewStart);
      const pos = diffDays(weekStart, today) / 7;
      if (pos < 0 || pos >= columns.length) return null;
      return pos * cellWidth;
    } else {
      const monthStart = getMonthStart(viewStart);
      const pos =
        (today.getFullYear() - monthStart.getFullYear()) * 12 +
        (today.getMonth() - monthStart.getMonth()) +
        today.getDate() / 30;
      if (pos < 0 || pos >= columns.length) return null;
      return pos * cellWidth;
    }
  }, [viewStart, zoom, columns, today, cellWidth]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigateBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-0.5">
          {(["day", "week", "month"] as ZoomLevel[]).map((z) => (
            <Button
              key={z}
              variant={zoom === z ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setZoom(z)}
              className="h-7 capitalize"
            >
              {z}
            </Button>
          ))}
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="rounded-lg border overflow-x-auto">
        <div className="flex min-w-0">
          {/* Task Names Column */}
          <div className="w-48 shrink-0 border-r">
            <div className="h-12 border-b bg-muted/50 px-3 flex items-center">
              <span className="text-xs font-medium text-muted-foreground">Tasks</span>
            </div>
            {taskBars.map(({ task, statusColor, isDone }) => (
              <div
                key={task.id}
                onClick={() => onTaskClick(task.id)}
                className="flex h-10 cursor-pointer items-center gap-2 border-b px-3 hover:bg-muted/50"
              >
                <div
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <span
                  className={cn(
                    "truncate text-sm",
                    isDone && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </span>
              </div>
            ))}
            {taskBars.length === 0 && (
              <div className="flex h-10 items-center px-3 text-sm text-muted-foreground">
                No tasks with dates
              </div>
            )}
          </div>

          {/* Timeline Grid */}
          <div className="flex-1 overflow-x-auto">
            {/* Header */}
            <div
              className="flex h-12 border-b bg-muted/50"
              style={{ width: totalWidth }}
            >
              {headerLabels.map((label, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex shrink-0 items-center justify-center border-r text-xs text-muted-foreground",
                    label.isToday && "bg-primary/10 font-semibold text-primary"
                  )}
                  style={{ width: cellWidth * label.span }}
                >
                  {label.label}
                </div>
              ))}
            </div>

            {/* Task Bars */}
            <div className="relative" style={{ width: totalWidth, minHeight: taskBars.length * 40 || 40 }}>
              {/* Grid Lines */}
              {columns.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-dashed border-border/50"
                  style={{ left: i * cellWidth }}
                />
              ))}

              {/* Today Line */}
              {todayPosition !== null && (
                <div
                  className="absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
                  style={{ left: todayPosition }}
                >
                  <div className="absolute -top-1 -left-1.5 h-3 w-3 rounded-full bg-red-500" />
                </div>
              )}

              {/* Task Bars */}
              {taskBars.map(({ task, left, width, statusColor, isDone, isOverdue }, idx) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  className="absolute flex h-10 cursor-pointer items-center border-b"
                  style={{ top: idx * 40, left: 0, right: 0 }}
                >
                  {/* Bar */}
                  <div
                    className={cn(
                      "absolute h-6 rounded-md transition-all hover:opacity-80",
                      isDone && "opacity-50",
                      isOverdue && "ring-2 ring-destructive/30"
                    )}
                    style={{
                      left: left * cellWidth + 4,
                      width: Math.max(width * cellWidth - 8, 20),
                      backgroundColor: statusColor + "30",
                      borderLeft: `3px solid ${statusColor}`,
                    }}
                  >
                    <div className="flex h-full items-center px-2">
                      <span className="truncate text-[11px] font-medium">
                        {task.title}
                      </span>
                    </div>
                  </div>

                  {/* Milestone Diamond */}
                  {task.isMilestone && task.dueDate && (
                    <div
                      className="absolute h-3 w-3 rotate-45 border-2 bg-background"
                      style={{
                        left:
                          (diffDays(viewStart, new Date(task.dueDate)) /
                            (zoom === "day" ? 1 : zoom === "week" ? 7 : 30)) *
                            cellWidth -
                          6,
                        borderColor: statusColor,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
