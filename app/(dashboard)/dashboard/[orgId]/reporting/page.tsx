"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  Target,
  TrendingUp,
  AlertCircle,
  Users,
  BarChart3,
} from "lucide-react";
import { getProjects } from "@/actions/projects";
import { getGoals } from "@/actions/goals";
import { getMembers } from "@/actions/members";
import { getMyTasks, getMyTaskStats } from "@/actions/my-tasks";
import { PROJECT_STATUSES, GOAL_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

export default function ReportingPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [projects, setProjects] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    overdue: 0,
    streak: 0,
  });
  const [myTasks, setMyTasks] = useState<any>({ today: [], upcoming: [], later: [], overdue: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [orgId]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [projectsData, goalsData, membersData, statsData, tasksData] =
        await Promise.all([
          getProjects(orgId),
          getGoals(orgId),
          getMembers(orgId),
          getMyTaskStats(),
          getMyTasks(),
        ]);
      setProjects(projectsData);
      setGoals(goalsData);
      setMembers(membersData);
      setTaskStats(statsData);
      setMyTasks(tasksData);
    } catch {
      // Handle error silently
    }
    setIsLoading(false);
  }

  // Calculate task status distribution
  const taskStatusData = PROJECT_STATUSES.map((status) => {
    const count = projects.reduce((sum, p) => {
      const statusTasks = p.tasks?.filter((t: any) => t.status === status.value).length || 0;
      return sum + statusTasks;
    }, 0);
    return { name: status.label, value: count, color: status.color };
  }).filter((d) => d.value > 0);

  // Calculate priority distribution
  const priorityData = TASK_PRIORITIES.map((priority) => {
    const count = projects.reduce((sum, p) => {
      const priorityTasks = p.tasks?.filter((t: any) => t.priority === priority.value).length || 0;
      return sum + priorityTasks;
    }, 0);
    return { name: priority.label, value: count, icon: priority.icon };
  }).filter((d) => d.value > 0);

  // Goal progress data
  const goalProgressData = goals.map((goal) => {
    const progress = goal.keyResults?.length
      ? Math.round(
          goal.keyResults.reduce((sum: number, kr: any) => {
            const range = kr.targetValue - kr.startValue;
            if (range === 0) return sum + (kr.currentValue >= kr.targetValue ? 100 : 0);
            return sum + Math.min(((kr.currentValue - kr.startValue) / range) * 100, 100);
          }, 0) / goal.keyResults.length
        )
      : 0;
    return { name: goal.title.slice(0, 20), progress, status: goal.status };
  });

  // Project status distribution
  const projectStatusData = PROJECT_STATUSES.map((status) => {
    const count = projects.filter((p) => p.status === status.value).length;
    return { name: status.label, value: count, color: status.color };
  }).filter((d) => d.value > 0);

  const totalTasks = projects.reduce((sum, p) => sum + (p._count?.tasks || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reporting</h1>
        <p className="text-muted-foreground">
          Analytics and insights for your workspace.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              {projects.filter((p) => p.status === "ON_TRACK").length} on track
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goals.length}</div>
            <p className="text-xs text-muted-foreground">
              {goals.filter((g) => g.status === "ON_TRACK").length} on track
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              in this workspace
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Project Status Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Project Status</CardTitle>
              </CardHeader>
              <CardContent>
                {projectStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={projectStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {projectStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    No project data
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goal Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Goal Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {goalProgressData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={goalProgressData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar
                        dataKey="progress"
                        fill="#6366f1"
                        radius={[0, 4, 4, 0]}
                      >
                        {goalProgressData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.status === "ACHIEVED"
                                ? "#22c55e"
                                : entry.status === "AT_RISK"
                                ? "#f59e0b"
                                : entry.status === "OFF_TRACK"
                                ? "#ef4444"
                                : "#6366f1"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                    No goals yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {members.slice(0, 5).map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                        {member.user?.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {member.user?.name || member.user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground">No members yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => {
              const status = PROJECT_STATUSES.find(
                (s) => s.value === project.status
              );
              return (
                <Card key={project.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <CardTitle className="text-sm">{project.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: status?.color,
                          color: status?.color,
                        }}
                      >
                        {status?.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {project._count?.tasks || 0} tasks
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {goals.map((goal) => {
            const progress = goal.keyResults?.length
              ? Math.round(
                  goal.keyResults.reduce((sum: number, kr: any) => {
                    const range = kr.targetValue - kr.startValue;
                    if (range === 0) return sum + (kr.currentValue >= kr.targetValue ? 100 : 0);
                    return sum + Math.min(((kr.currentValue - kr.startValue) / range) * 100, 100);
                  }, 0) / goal.keyResults.length
                )
              : 0;
            const status = GOAL_STATUSES.find((s) => s.value === goal.status);

            return (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{goal.title}</CardTitle>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: status?.color,
                        color: status?.color,
                      }}
                    >
                      {status?.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="h-2" />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {progress}% complete
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
