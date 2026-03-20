"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  CheckCircle2,
  Plus,
  MessageSquare,
  ArrowRight,
  Tag,
  Paperclip,
  Clock,
  RefreshCw,
} from "lucide-react";
import { getActivityFeed } from "@/actions/comments";
import { formatRelativeTime, getInitials } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  user: { id: string; name: string | null; image: string | null };
  task: {
    id: string;
    title: string;
    projectId: string;
    project: { name: string; color: string } | null;
  };
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CREATED: Plus,
  UPDATED: RefreshCw,
  STATUS_CHANGED: ArrowRight,
  ASSIGNED: CheckCircle2,
  UNASSIGNED: CheckCircle2,
  COMMENTED: MessageSquare,
  ATTACHED: Paperclip,
  COMPLETED: CheckCircle2,
  REOPENED: RefreshCw,
  MOVED: ArrowRight,
  LABEL_ADDED: Tag,
  LABEL_REMOVED: Tag,
};

const activityLabels: Record<string, string> = {
  CREATED: "created",
  UPDATED: "updated",
  STATUS_CHANGED: "changed status of",
  ASSIGNED: "assigned",
  UNASSIGNED: "unassigned from",
  COMMENTED: "commented on",
  ATTACHED: "attached file to",
  COMPLETED: "completed",
  REOPENED: "reopened",
  MOVED: "moved",
  LABEL_ADDED: "added label to",
  LABEL_REMOVED: "removed label from",
};

export default function ActivityFeedPage() {
  const params = useParams();
  const orgId = (params as any).orgId || "";
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadActivities();
  }, [orgId]);

  async function loadActivities() {
    setIsLoading(true);
    try {
      const data = await getActivityFeed(orgId);
      setActivities(data as any);
    } catch {
      // Handle silently
    }
    setIsLoading(false);
  }

  const filteredActivities =
    filter === "all"
      ? activities
      : activities.filter((a) => a.type === filter);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground">
            Recent activity across all projects.
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activity</SelectItem>
            <SelectItem value="CREATED">Created</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="COMMENTED">Comments</SelectItem>
            <SelectItem value="STATUS_CHANGED">Status Changes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              Activity will appear here as your team works.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {filteredActivities.map((activity) => {
              const Icon = activityIcons[activity.type] || Activity;
              const label = activityLabels[activity.type] || activity.type;

              return (
                <div key={activity.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-1 flex h-3 w-3 items-center justify-center">
                    <div className="h-3 w-3 rounded-full border-2 border-background bg-primary" />
                  </div>

                  <div className="flex-1 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={activity.user.image ?? ""} />
                        <AvatarFallback className="text-[10px]">
                          {activity.user.name
                            ? getInitials(activity.user.name)
                            : "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.user.name || "Someone"}
                          </span>{" "}
                          {label}{" "}
                          <span className="font-medium">
                            {activity.task.title}
                          </span>
                        </p>

                        <div className="mt-1 flex items-center gap-2">
                          {activity.task.project && (
                            <Badge
                              variant="secondary"
                              className="gap-1 text-[10px]"
                            >
                              <div
                                className="h-1.5 w-1.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    activity.task.project.color,
                                }}
                              />
                              {activity.task.project.name}
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(activity.createdAt)}
                          </span>
                        </div>

                        {activity.newValue && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Changed to: <strong>{activity.newValue}</strong>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
