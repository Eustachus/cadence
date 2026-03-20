import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(1, "Token is required"),
});

export const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  status: z.enum(["ON_TRACK", "AT_RISK", "OFF_TRACK", "ON_HOLD", "COMPLETE"]).optional(),
  isPublic: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  teamId: z.string().optional().nullable(),
  organizationId: z.string(),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  projectId: z.string(),
  sectionId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  organizationId: z.string(),
  assigneeIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
  estimatedHours: z.number().optional().nullable(),
  storyPoints: z.number().int().optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  id: z.string(),
});

export const createCommentSchema = z.object({
  body: z.string().min(1, "Comment cannot be empty"),
  taskId: z.string(),
  parentId: z.string().optional().nullable(),
});

export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  period: z.enum(["MONTH", "QUARTER", "HALF_YEAR", "YEAR", "CUSTOM"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  parentId: z.string().optional().nullable(),
  organizationId: z.string(),
});

export const createKeyResultSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["NUMERIC", "PERCENTAGE", "CURRENCY", "BINARY"]),
  startValue: z.number().default(0),
  targetValue: z.number().default(100),
  unit: z.string().optional().nullable(),
  goalId: z.string(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  organizationId: z.string(),
});

export const createLabelSchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z.string().optional(),
  organizationId: z.string(),
});

export const createCustomFieldSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["TEXT", "NUMBER", "DATE", "CHECKBOX", "SELECT", "MULTI_SELECT", "PERSON", "CURRENCY", "PERCENTAGE", "RATING", "URL", "EMAIL", "PHONE"]),
  options: z.any().optional(),
  projectId: z.string().optional().nullable(),
  organizationId: z.string(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
  organizationId: z.string(),
});

export const createPageSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.any().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  organizationId: z.string(),
});

export const createPortfolioSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
  organizationId: z.string(),
  projectIds: z.array(z.string()).optional(),
});

export const createAutomationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  trigger: z.string(),
  conditions: z.any().optional(),
  actions: z.any(),
  projectId: z.string().optional().nullable(),
  organizationId: z.string(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  image: z.string().optional(),
});

export const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  types: z.array(z.enum(["task", "project", "page", "goal", "member", "comment"])).optional(),
  organizationId: z.string(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateOrgInput = z.infer<typeof createOrgSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
