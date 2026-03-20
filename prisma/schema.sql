-- FlowPlan Database Schema for PostgreSQL

-- Users
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  password TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 0,
  "lastActiveAt" TIMESTAMPTZ
);

-- Account
CREATE TABLE IF NOT EXISTS "Account" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

-- Session
CREATE TABLE IF NOT EXISTS "Session" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

-- VerificationToken
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, token)
);

-- Organization
CREATE TABLE IF NOT EXISTS "Organization" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image TEXT,
  description TEXT,
  plan TEXT DEFAULT 'free',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Membership
CREATE TABLE IF NOT EXISTS "Membership" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role TEXT DEFAULT 'MEMBER',
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "invitedEmail" TEXT,
  "inviteToken" TEXT UNIQUE,
  "inviteExpires" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "organizationId")
);

-- Team
CREATE TABLE IF NOT EXISTS "Team" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- TeamMember
CREATE TABLE IF NOT EXISTS "TeamMember" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  role TEXT DEFAULT 'MEMBER',
  "teamId" TEXT NOT NULL REFERENCES "Team"(id) ON DELETE CASCADE,
  "memberId" TEXT NOT NULL REFERENCES "Membership"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("teamId", "memberId")
);

-- Project
CREATE TABLE IF NOT EXISTS "Project" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  status TEXT DEFAULT 'ON_TRACK',
  "isPublic" BOOLEAN DEFAULT true,
  "isFavorite" BOOLEAN DEFAULT false,
  "isPinned" BOOLEAN DEFAULT false,
  "isArchived" BOOLEAN DEFAULT false,
  "startDate" TIMESTAMPTZ,
  "endDate" TIMESTAMPTZ,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "teamId" TEXT REFERENCES "Team"(id) ON DELETE SET NULL,
  "createdBy" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Section
CREATE TABLE IF NOT EXISTS "Section" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  position FLOAT DEFAULT 0,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Task
CREATE TABLE IF NOT EXISTS "Task" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'TODO',
  priority TEXT DEFAULT 'NONE',
  position FLOAT DEFAULT 0,
  "dueDate" TIMESTAMPTZ,
  "startDate" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ,
  "isArchived" BOOLEAN DEFAULT false,
  "isMilestone" BOOLEAN DEFAULT false,
  "estimatedHours" FLOAT,
  "storyPoints" INTEGER,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  "sectionId" TEXT REFERENCES "Section"(id) ON DELETE SET NULL,
  "parentTaskId" TEXT REFERENCES "Task"(id) ON DELETE CASCADE,
  "createdBy" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- TaskAssignment
CREATE TABLE IF NOT EXISTS "TaskAssignment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "taskId" TEXT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "memberId" TEXT NOT NULL REFERENCES "Membership"(id) ON DELETE CASCADE,
  "assignedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("taskId", "memberId")
);

-- Label
CREATE TABLE IF NOT EXISTS "Label" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6B7280',
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, "organizationId")
);

-- TaskLabel
CREATE TABLE IF NOT EXISTS "TaskLabel" (
  "taskId" TEXT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "labelId" TEXT NOT NULL REFERENCES "Label"(id) ON DELETE CASCADE,
  PRIMARY KEY("taskId", "labelId")
);

-- Comment
CREATE TABLE IF NOT EXISTS "Comment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  body TEXT NOT NULL,
  "taskId" TEXT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES "User"(id),
  "parentId" TEXT REFERENCES "Comment"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- CommentReaction
CREATE TABLE IF NOT EXISTS "CommentReaction" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  emoji TEXT NOT NULL,
  "commentId" TEXT NOT NULL REFERENCES "Comment"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  UNIQUE("commentId", "userId", emoji)
);

-- TaskActivity
CREATE TABLE IF NOT EXISTS "TaskActivity" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  field TEXT,
  "oldValue" TEXT,
  "newValue" TEXT,
  "taskId" TEXT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- TimeEntry
CREATE TABLE IF NOT EXISTS "TimeEntry" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  description TEXT,
  hours FLOAT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  "taskId" TEXT NOT NULL REFERENCES "Task"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  billable BOOLEAN DEFAULT false,
  "hourlyRate" FLOAT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Goal
CREATE TABLE IF NOT EXISTS "Goal" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ON_TRACK',
  period TEXT DEFAULT 'QUARTER',
  "startDate" TIMESTAMPTZ NOT NULL,
  "endDate" TIMESTAMPTZ NOT NULL,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdBy" TEXT NOT NULL REFERENCES "User"(id),
  "parentId" TEXT REFERENCES "Goal"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- KeyResult
CREATE TABLE IF NOT EXISTS "KeyResult" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'NUMERIC',
  "startValue" FLOAT DEFAULT 0,
  "targetValue" FLOAT DEFAULT 100,
  "currentValue" FLOAT DEFAULT 0,
  unit TEXT,
  status TEXT DEFAULT 'ON_TRACK',
  "goalId" TEXT NOT NULL REFERENCES "Goal"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- GoalCheckIn
CREATE TABLE IF NOT EXISTS "GoalCheckIn" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  note TEXT,
  status TEXT NOT NULL,
  progress FLOAT,
  "goalId" TEXT NOT NULL REFERENCES "Goal"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio
CREATE TABLE IF NOT EXISTS "Portfolio" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdBy" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- PortfolioProject
CREATE TABLE IF NOT EXISTS "PortfolioProject" (
  "portfolioId" TEXT NOT NULL REFERENCES "Portfolio"(id) ON DELETE CASCADE,
  "projectId" TEXT NOT NULL REFERENCES "Project"(id) ON DELETE CASCADE,
  PRIMARY KEY("portfolioId", "projectId")
);

-- Notification
CREATE TABLE IF NOT EXISTS "Notification" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "orgId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Page
CREATE TABLE IF NOT EXISTS "Page" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  content JSONB,
  icon TEXT,
  "isPublic" BOOLEAN DEFAULT false,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "parentId" TEXT REFERENCES "Page"(id) ON DELETE CASCADE,
  "createdBy" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- PageComment
CREATE TABLE IF NOT EXISTS "PageComment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  body TEXT NOT NULL,
  "pageId" TEXT NOT NULL REFERENCES "Page"(id) ON DELETE CASCADE,
  "authorId" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- PageVersion
CREATE TABLE IF NOT EXISTS "PageVersion" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  content JSONB,
  "pageId" TEXT NOT NULL REFERENCES "Page"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Badge
CREATE TABLE IF NOT EXISTS "Badge" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  "xpReward" INTEGER DEFAULT 0,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, "organizationId")
);

-- UserBadge
CREATE TABLE IF NOT EXISTS "UserBadge" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "badgeId" TEXT NOT NULL REFERENCES "Badge"(id) ON DELETE CASCADE,
  "awardedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("userId", "badgeId")
);
