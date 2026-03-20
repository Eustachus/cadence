"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Minus,
  Loader2,
} from "lucide-react";
import { getGoals, createGoal, updateGoal, deleteGoal, updateKeyResult } from "@/actions/goals";
import { GOAL_STATUSES } from "@/lib/constants";
import { formatDate, cn } from "@/lib/utils";
import { toast } from "sonner";

interface KeyResult {
  id: string;
  title: string;
  type: string;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  status: string;
  goalId: string;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: string;
  period: string;
  startDate: Date;
  endDate: Date;
  keyResults: KeyResult[];
  children: Goal[];
  checkIns: Array<{
    id: string;
    note: string | null;
    status: string;
    progress: number | null;
    createdAt: Date;
    user: { name: string | null };
  }>;
  _count: { keyResults: number; children: number };
}

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ON_TRACK: TrendingUp,
  AT_RISK: AlertCircle,
  OFF_TRACK: TrendingDown,
  ACHIEVED: CheckCircle2,
  DROPPED: Minus,
  PENDING: Minus,
};

export default function GoalsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    period: "QUARTER",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [keyResults, setKeyResults] = useState<Array<{
    title: string;
    type: string;
    startValue: number;
    targetValue: number;
    unit: string;
  }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadGoals();
  }, [orgId]);

  async function loadGoals() {
    setIsLoading(true);
    try {
      const data = await getGoals(orgId);
      setGoals(data as any);
    } catch {
      toast.error("Failed to load goals");
    }
    setIsLoading(false);
  }

  async function handleCreate() {
    setIsSubmitting(true);
    try {
      const result = await createGoal(orgId, {
        ...formData,
        keyResults: keyResults.filter((kr) => kr.title.trim()),
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Goal created!");
        setIsCreateOpen(false);
        setFormData({
          title: "",
          description: "",
          period: "QUARTER",
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
        });
        setKeyResults([]);
        loadGoals();
      }
    } catch {
      toast.error("Failed to create goal");
    }
    setIsSubmitting(false);
  }

  async function handleDelete(goalId: string) {
    if (!confirm("Delete this goal?")) return;
    try {
      await deleteGoal(orgId, goalId);
      toast.success("Goal deleted");
      loadGoals();
    } catch {
      toast.error("Failed to delete goal");
    }
  }

  async function handleUpdateKR(krId: string, currentValue: number) {
    try {
      await updateKeyResult(orgId, krId, { currentValue });
      loadGoals();
    } catch {
      toast.error("Failed to update key result");
    }
  }

  function getGoalProgress(goal: Goal): number {
    if (goal.keyResults.length === 0) return 0;
    const total = goal.keyResults.reduce((sum, kr) => {
      const range = kr.targetValue - kr.startValue;
      if (range === 0) return sum + (kr.currentValue >= kr.targetValue ? 100 : 0);
      const progress = ((kr.currentValue - kr.startValue) / range) * 100;
      return sum + Math.min(Math.max(progress, 0), 100);
    }, 0);
    return Math.round(total / goal.keyResults.length);
  }

  function getKRProgress(kr: KeyResult): number {
    const range = kr.targetValue - kr.startValue;
    if (range === 0) return kr.currentValue >= kr.targetValue ? 100 : 0;
    const progress = ((kr.currentValue - kr.startValue) / range) * 100;
    return Math.min(Math.max(progress, 0), 100);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals & OKRs</h1>
          <p className="text-muted-foreground">
            Track objectives and key results.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create a goal</DialogTitle>
              <DialogDescription>
                Set an objective with measurable key results.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Increase user engagement"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the goal..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(v) =>
                      setFormData((f) => ({ ...f, period: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MONTH">Month</SelectItem>
                      <SelectItem value="QUARTER">Quarter</SelectItem>
                      <SelectItem value="HALF_YEAR">Half Year</SelectItem>
                      <SelectItem value="YEAR">Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Key Results */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Key Results</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setKeyResults((prev) => [
                        ...prev,
                        { title: "", type: "NUMERIC", startValue: 0, targetValue: 100, unit: "" },
                      ])
                    }
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
                {keyResults.map((kr, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder="Key result title"
                      value={kr.title}
                      onChange={(e) => {
                        const newKRs = [...keyResults];
                        newKRs[i].title = e.target.value;
                        setKeyResults(newKRs);
                      }}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Target"
                      value={kr.targetValue}
                      onChange={(e) => {
                        const newKRs = [...keyResults];
                        newKRs[i].targetValue = parseFloat(e.target.value) || 0;
                        setKeyResults(newKRs);
                      }}
                      className="w-20"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setKeyResults((prev) => prev.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !formData.title}
                className="w-full"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create goal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Target className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No goals yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first goal to start tracking progress.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = getGoalProgress(goal);
            const status = GOAL_STATUSES.find(
              (s) => s.value === goal.status
            );
            const StatusIcon = statusIcons[goal.status] || Minus;

            return (
              <Card key={goal.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{goal.title}</CardTitle>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: status?.color,
                            color: status?.color,
                          }}
                        >
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status?.label || goal.status}
                        </Badge>
                        <Badge variant="secondary">{goal.period}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(goal.startDate)} — {formatDate(goal.endDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{progress}%</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(goal.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <Progress value={progress} className="mt-2 h-2" />
                </CardHeader>

                {/* Key Results */}
                {goal.keyResults.length > 0 && (
                  <CardContent className="space-y-3 pt-0">
                    <h4 className="text-sm font-semibold text-muted-foreground">
                      Key Results
                    </h4>
                    {goal.keyResults.map((kr) => {
                      const krProgress = getKRProgress(kr);
                      const krStatus = GOAL_STATUSES.find(
                        (s) => s.value === kr.status
                      );

                      return (
                        <div
                          key={kr.id}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {kr.title}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {kr.currentValue} / {kr.targetValue}
                                {kr.unit ? ` ${kr.unit}` : ""}
                              </span>
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: krStatus?.color,
                                  color: krStatus?.color,
                                }}
                              >
                                {krProgress}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={krProgress} className="mt-2 h-1.5" />
                        </div>
                      );
                    })}
                  </CardContent>
                )}

                {/* Recent Check-ins */}
                {goal.checkIns.length > 0 && (
                  <CardContent className="border-t pt-4">
                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground">
                      Recent Check-ins
                    </h4>
                    {goal.checkIns.map((checkIn) => (
                      <div
                        key={checkIn.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="font-medium">
                          {checkIn.user.name || "Unknown"}
                        </span>
                        <span className="text-muted-foreground">
                          — {checkIn.note || checkIn.status}
                        </span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDate(checkIn.createdAt)}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
