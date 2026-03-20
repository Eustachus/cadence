"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  Check,
  CheckCheck,
  MoreVertical,
  Trash2,
  Archive,
  Inbox,
  AtSign,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Settings,
} from "lucide-react";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
} from "@/actions/notifications";
import { formatRelativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  archived: boolean;
  createdAt: Date;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  TASK_ASSIGNED: UserPlus,
  TASK_COMPLETED: CheckCircle2,
  TASK_COMMENT: MessageSquare,
  TASK_MENTION: AtSign,
  TASK_DUE_SOON: AlertCircle,
  TASK_OVERDUE: AlertCircle,
  PROJECT_STATUS_UPDATE: Bell,
  GOAL_CHECK_IN: Bell,
  MEMBER_INVITED: UserPlus,
  APPROVAL_REQUESTED: Check,
  APPROVAL_DECIDED: Check,
  AUTOMATION_TRIGGERED: Bell,
  SYSTEM: Settings,
};

const typeColors: Record<string, string> = {
  TASK_ASSIGNED: "text-blue-500",
  TASK_COMPLETED: "text-green-500",
  TASK_COMMENT: "text-purple-500",
  TASK_MENTION: "text-orange-500",
  TASK_DUE_SOON: "text-yellow-500",
  TASK_OVERDUE: "text-red-500",
};

export default function InboxPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "mentions">("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setIsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    }
    setIsLoading(false);
  }

  async function handleMarkRead(id: string) {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      toast.error("Failed to mark as read");
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  }

  async function handleArchive(id: string) {
    try {
      await archiveNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Failed to archive");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "mentions") return n.type === "TASK_MENTION";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
          <p className="text-muted-foreground">
            Stay up to date with notifications.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {notifications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="mentions">Mentions</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Inbox className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">
                  {filter === "unread"
                    ? "All caught up!"
                    : filter === "mentions"
                    ? "No mentions"
                    : "No notifications"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {filter === "unread"
                    ? "You've read all your notifications."
                    : "Notifications will appear here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const color = typeColors[notification.type] || "text-muted-foreground";

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "group flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                      !notification.read && "bg-primary/5 border-primary/20",
                      notification.link && "cursor-pointer"
                    )}
                    onClick={() => {
                      if (!notification.read) handleMarkRead(notification.id);
                      if (notification.link) router.push(notification.link);
                    }}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted",
                        color
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={cn(
                              "text-sm font-medium",
                              !notification.read && "font-semibold"
                            )}
                          >
                            {notification.title}
                          </p>
                          {notification.body && (
                            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                              {notification.body}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(notification.id);
                              }}
                              className="shrink-0 rounded-full p-1 hover:bg-muted"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3 text-muted-foreground" />
                            </button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 rounded-full p-1 opacity-0 hover:bg-muted group-hover:opacity-100"
                              >
                                <MoreVertical className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.read && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleMarkRead(notification.id)
                                  }
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Mark as read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleArchive(notification.id)}
                              >
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(notification.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {!notification.read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
