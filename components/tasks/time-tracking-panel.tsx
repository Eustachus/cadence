"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Play,
  Pause,
  Square,
  Clock,
  Plus,
  Trash2,
  DollarSign,
  BarChart3,
  Loader2,
} from "lucide-react";
import {
  createTimeEntry,
  deleteTimeEntry,
  getTimeEntries,
} from "@/actions/time-tracking";
import { formatRelativeTime, formatHours } from "@/lib/utils";
import { toast } from "sonner";

interface TimeEntry {
  id: string;
  description: string | null;
  hours: number;
  date: Date;
  billable: boolean;
  hourlyRate: number | null;
  task: {
    id: string;
    title: string;
    project: { name: string; color: string } | null;
  };
  user: { id: string; name: string | null; image: string | null };
}

interface TimeTrackingPanelProps {
  orgId: string;
  taskId?: string;
}

export function TimeTrackingPanel({ orgId, taskId }: TimeTrackingPanelProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerDescription, setTimerDescription] = useState("");
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [manualHours, setManualHours] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualBillable, setManualBillable] = useState(false);
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadEntries();
  }, [orgId, taskId]);

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isTimerRunning]);

  async function loadEntries() {
    setIsLoading(true);
    try {
      const data = await getTimeEntries(orgId, { taskId });
      setEntries(data);
    } catch {
      toast.error("Failed to load time entries");
    }
    setIsLoading(false);
  }

  function startTimer() {
    setIsTimerRunning(true);
    setElapsedSeconds(0);
  }

  function pauseTimer() {
    setIsTimerRunning(false);
  }

  async function stopTimer() {
    setIsTimerRunning(false);
    if (elapsedSeconds < 1) return;

    const hours = elapsedSeconds / 3600;
    try {
      await createTimeEntry(orgId, {
        taskId: taskId || "",
        description: timerDescription || undefined,
        hours: Math.round(hours * 100) / 100,
        date: new Date().toISOString(),
        billable: false,
      });
      toast.success(`Logged ${formatHours(hours)}`);
      setTimerDescription("");
      setElapsedSeconds(0);
      loadEntries();
    } catch {
      toast.error("Failed to log time");
    }
  }

  async function handleManualEntry() {
    const hours = parseFloat(manualHours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Enter valid hours");
      return;
    }
    if (!taskId) {
      toast.error("Select a task first");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTimeEntry(orgId, {
        taskId,
        description: manualDescription || undefined,
        hours,
        date: manualDate,
        billable: manualBillable,
      });
      toast.success("Time entry added!");
      setManualHours("");
      setManualDescription("");
      setManualBillable(false);
      setIsManualOpen(false);
      loadEntries();
    } catch {
      toast.error("Failed to add entry");
    }
    setIsSubmitting(false);
  }

  async function handleDeleteEntry(entryId: string) {
    try {
      await deleteTimeEntry(orgId, entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + e.hours, 0);
  const totalCost = entries
    .filter((e) => e.billable && e.hourlyRate)
    .reduce((sum, e) => sum + e.hours * (e.hourlyRate || 0), 0);

  function formatTimerDisplay(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-4">
      {/* Timer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Time Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="font-mono text-3xl font-bold">
                {formatTimerDisplay(elapsedSeconds)}
              </div>
              {isTimerRunning && (
                <Input
                  placeholder="What are you working on?"
                  value={timerDescription}
                  onChange={(e) => setTimerDescription(e.target.value)}
                  className="mt-2 h-8 text-sm"
                />
              )}
            </div>
            <div className="flex gap-2">
              {!isTimerRunning ? (
                <Button size="sm" onClick={startTimer} className="gap-1">
                  <Play className="h-4 w-4" />
                  Start
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={pauseTimer}>
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={stopTimer}>
                    <Square className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-3 w-3" />
                  Manual Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Time Entry</DialogTitle>
                  <DialogDescription>
                    Log time manually for this task.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Hours</Label>
                      <Input
                        type="number"
                        step="0.25"
                        min="0"
                        placeholder="1.5"
                        value={manualHours}
                        onChange={(e) => setManualHours(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={manualDate}
                        onChange={(e) => setManualDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What did you work on?"
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Billable</Label>
                    <Switch
                      checked={manualBillable}
                      onCheckedChange={setManualBillable}
                    />
                  </div>
                  <Button
                    onClick={handleManualEntry}
                    disabled={isSubmitting || !manualHours}
                    className="w-full"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Entry
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="text-lg font-bold">{formatHours(totalHours)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-xs text-muted-foreground">Billable</div>
            <div className="text-lg font-bold">
              {formatHours(billableHours)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Cost
            </div>
            <div className="text-lg font-bold">
              ${totalCost.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : entries.length > 0 ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.slice(0, 10).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatRelativeTime(entry.date)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.description || entry.task.title}
                    {entry.billable && (
                      <Badge variant="secondary" className="ml-2 text-[10px]">
                        Billable
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatHours(entry.hours)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No time entries yet. Start the timer or add a manual entry.
        </div>
      )}
    </div>
  );
}
