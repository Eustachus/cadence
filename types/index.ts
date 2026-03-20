// ─────────────────────────────────────────────
// Core Type Definitions for Cadence
// ─────────────────────────────────────────────

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
export type TaskPriority = "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
export type ProjectStatus = "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "ON_HOLD" | "COMPLETE";
export type GoalStatus = "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "ACHIEVED" | "DROPPED" | "PENDING";
export type MemberRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type TeamRole = "ADMIN" | "MEMBER" | "OBSERVER";
export type GoalPeriod = "MONTH" | "QUARTER" | "HALF_YEAR" | "YEAR" | "CUSTOM";
export type KeyResultType = "NUMERIC" | "PERCENTAGE" | "CURRENCY" | "BINARY";
export type CustomFieldType = "TEXT" | "NUMBER" | "DATE" | "CHECKBOX" | "SELECT" | "MULTI_SELECT" | "PERSON" | "CURRENCY" | "PERCENTAGE" | "RATING" | "URL" | "EMAIL" | "PHONE";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_COMPLETED"
  | "TASK_COMMENT"
  | "TASK_MENTION"
  | "TASK_DUE_SOON"
  | "TASK_OVERDUE"
  | "PROJECT_STATUS_UPDATE"
  | "GOAL_CHECK_IN"
  | "MEMBER_INVITED"
  | "APPROVAL_REQUESTED"
  | "APPROVAL_DECIDED"
  | "AUTOMATION_TRIGGERED"
  | "SYSTEM";
export type ActivityType =
  | "CREATED"
  | "UPDATED"
  | "STATUS_CHANGED"
  | "ASSIGNED"
  | "UNASSIGNED"
  | "COMMENTED"
  | "ATTACHED"
  | "COMPLETED"
  | "REOPENED"
  | "MOVED"
  | "LABEL_ADDED"
  | "LABEL_REMOVED"
  | "DEPENDENCY_ADDED"
  | "DEPENDENCY_REMOVED";

// ─────────────────────────────────────────────
// Entity Types
// ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  bio: string | null;
  timezone: string;
  language: string;
  xp: number;
  level: number;
  streak: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  logo: string | null;
  description: string | null;
  domain: string | null;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Membership {
  id: string;
  role: MemberRole;
  userId: string;
  organizationId: string;
  invitedEmail: string | null;
  inviteToken: string | null;
  inviteExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  organization?: Organization;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  role: TeamRole;
  teamId: string;
  memberId: string;
  createdAt: Date;
  member?: Membership;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  status: ProjectStatus;
  isPublic: boolean;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  startDate: Date | null;
  endDate: Date | null;
  organizationId: string;
  teamId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  team?: Team | null;
  tasks?: Task[];
  sections?: Section[];
  _count?: {
    tasks: number;
  };
}

export interface Section {
  id: string;
  name: string;
  position: number;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate: Date | null;
  startDate: Date | null;
  completedAt: Date | null;
  isArchived: boolean;
  isMilestone: boolean;
  estimatedHours: number | null;
  storyPoints: number | null;
  recurrence: string | null;
  organizationId: string;
  projectId: string;
  sectionId: string | null;
  parentTaskId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  assignments?: TaskAssignment[];
  labels?: TaskLabel[];
  comments?: Comment[];
  subTasks?: Task[];
  project?: Project;
  section?: Section | null;
  parentTask?: Task | null;
  creator?: User;
  _count?: {
    comments: number;
    subTasks: number;
    attachments: number;
  };
}

export interface TaskAssignment {
  id: string;
  taskId: string;
  memberId: string;
  assignedAt: Date;
  member?: Membership;
}

export interface TaskLabel {
  taskId: string;
  labelId: string;
  label?: Label;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  organizationId: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  body: string;
  taskId: string;
  authorId: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
  replies?: Comment[];
  reactions?: CommentReaction[];
}

export interface CommentReaction {
  id: string;
  emoji: string;
  commentId: string;
  userId: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  taskId: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface TaskActivity {
  id: string;
  type: ActivityType;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  taskId: string;
  userId: string;
  createdAt: Date;
  user?: User;
}

export interface TimeEntry {
  id: string;
  description: string | null;
  hours: number;
  date: Date;
  taskId: string;
  userId: string;
  billable: boolean;
  hourlyRate: number | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  task?: Task;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  period: GoalPeriod;
  startDate: Date;
  endDate: Date;
  organizationId: string;
  createdBy: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  keyResults?: KeyResult[];
  children?: Goal[];
  parent?: Goal | null;
  _count?: {
    keyResults: number;
    children: number;
  };
}

export interface KeyResult {
  id: string;
  title: string;
  type: KeyResultType;
  startValue: number;
  targetValue: number;
  currentValue: number;
  unit: string | null;
  status: GoalStatus;
  goalId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  color: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];
  _count?: {
    projects: number;
  };
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  archived: boolean;
  userId: string;
  orgId: string;
  createdAt: Date;
}

export interface Page {
  id: string;
  title: string;
  content: unknown;
  icon: string | null;
  coverImage: string | null;
  isPublic: boolean;
  organizationId: string;
  parentId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  children?: Page[];
  parent?: Page | null;
  _count?: {
    children: number;
  };
}

export interface CustomField {
  id: string;
  name: string;
  type: CustomFieldType;
  options: unknown;
  organizationId: string;
  projectId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: unknown;
  actions: unknown;
  isEnabled: boolean;
  projectId: string | null;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  isDefault: boolean;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  widgets?: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: unknown;
  position: unknown;
  dashboardId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
  organizationId: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// Socket Events
// ─────────────────────────────────────────────

export interface SocketEvents {
  "task:created": Task;
  "task:updated": Task;
  "task:deleted": { id: string };
  "task:moved": { id: string; projectId: string; sectionId: string | null };
  "comment:created": Comment;
  "notification:new": Notification;
  "presence:update": { userId: string; status: "online" | "away" | "offline"; currentPage?: string };
  "member:joined": Membership;
  "project:updated": Project;
}

// ─────────────────────────────────────────────
// View Configuration
// ─────────────────────────────────────────────

export interface ViewConfig {
  mode: "list" | "board" | "timeline" | "calendar" | "files" | "workload" | "form";
  groupBy: "status" | "assignee" | "priority" | "dueDate" | "section" | "label" | "none";
  sortBy: string;
  sortDirection: "asc" | "desc";
  filters: FilterConfig[];
  visibleColumns: string[];
}

export interface FilterConfig {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "gt" | "lt" | "gte" | "lte" | "in" | "not_in" | "is_empty" | "is_not_empty";
  value: unknown;
  conjunction?: "AND" | "OR";
}
