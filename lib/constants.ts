// ─────────────────────────────────────────────
// Task Statuses
// ─────────────────────────────────────────────

export const TASK_STATUSES = [
  { value: "BACKLOG", label: "Backlog", color: "#94a3b8" },
  { value: "TODO", label: "To Do", color: "#60a5fa" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#f59e0b" },
  { value: "IN_REVIEW", label: "In Review", color: "#a78bfa" },
  { value: "DONE", label: "Done", color: "#34d399" },
  { value: "CANCELLED", label: "Cancelled", color: "#f87171" },
] as const;

export const TASK_PRIORITIES = [
  { value: "URGENT", label: "Urgent", color: "#ef4444", icon: "🔴" },
  { value: "HIGH", label: "High", color: "#f97316", icon: "🟠" },
  { value: "MEDIUM", label: "Medium", color: "#eab308", icon: "🟡" },
  { value: "LOW", label: "Low", color: "#22c55e", icon: "🟢" },
  { value: "NONE", label: "None", color: "#94a3b8", icon: "⚪" },
] as const;

export const PROJECT_STATUSES = [
  { value: "ON_TRACK", label: "On Track", color: "#22c55e" },
  { value: "AT_RISK", label: "At Risk", color: "#f59e0b" },
  { value: "OFF_TRACK", label: "Off Track", color: "#ef4444" },
  { value: "ON_HOLD", label: "On Hold", color: "#94a3b8" },
  { value: "COMPLETE", label: "Complete", color: "#6366f1" },
] as const;

export const GOAL_STATUSES = [
  { value: "ON_TRACK", label: "On Track", color: "#22c55e" },
  { value: "AT_RISK", label: "At Risk", color: "#f59e0b" },
  { value: "OFF_TRACK", label: "Off Track", color: "#ef4444" },
  { value: "ACHIEVED", label: "Achieved", color: "#6366f1" },
  { value: "DROPPED", label: "Dropped", color: "#94a3b8" },
  { value: "PENDING", label: "Pending", color: "#94a3b8" },
] as const;

export const MEMBER_ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MEMBER", label: "Member" },
  { value: "VIEWER", label: "Viewer" },
] as const;

export const LABEL_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#6b7280", "#78716c", "#000000",
] as const;

export const PROJECT_ICONS = [
  "folder", "rocket", "star", "heart", "flag", "zap",
  "target", "compass", "map", "bookmark", "gift", "sun",
  "moon", "cloud", "flame", "droplet", "leaf", "mountain",
] as const;

export const VIEW_MODES = ["list", "board", "timeline", "calendar", "files", "workload", "form"] as const;

export type ViewMode = (typeof VIEW_MODES)[number];

export const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/my-tasks", label: "My Tasks", icon: "check-circle" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
] as const;

export const SIDEBAR_BOTTOM_NAV = [
  { href: "/search", label: "Search", icon: "search" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;
