# Cadence - Deployment Guide

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. The app uses SQLite by default - no database setup needed
# The DATABASE_URL defaults to file:./dev.db

# 4. Push schema and seed database
npx prisma db push
npx prisma db seed

# 5. Start development server
npm run dev

# → http://localhost:3000
# Login: demo@cadence.app / password123
```

## Production Deployment (Vercel + Supabase)

### Step 1: Set up Supabase

1. Create a Supabase project at https://supabase.com
2. Go to Settings → Database
3. Copy the connection string (Transaction mode)
4. Replace `[YOUR-PASSWORD]` with your database password

### Step 2: Switch to PostgreSQL schema

```bash
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

### Step 3: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 4: Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Supabase connection string |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

### Step 5: Run migrations on first deploy

After the first deploy, run:

```bash
vercel env pull .env.production
npx prisma db push --schema=prisma/schema.postgresql.prisma
npx prisma db seed
```

## Features Implemented

### Core Features
- ✅ Multi-tenant organizations with teams
- ✅ Projects with sections and custom fields
- ✅ Tasks with subtasks, dependencies, assignments
- ✅ 4 views: Board (Kanban), List, Calendar, Timeline/Gantt
- ✅ Drag and drop (@dnd-kit)
- ✅ Real-time updates (Socket.io)

### Collaboration
- ✅ Comments with threads and emoji reactions
- ✅ Activity feed
- ✅ Notifications (in-app)
- ✅ @mentions

### Productivity
- ✅ Goals & OKR tracking with key results
- ✅ Time tracking with timer
- ✅ Portfolios for multi-project overview
- ✅ Custom forms builder
- ✅ Wiki/Pages with hierarchy

### Analytics
- ✅ Dashboard with charts (Recharts)
- ✅ Reporting by project/status/priority
- ✅ Goal progress tracking

### UX
- ✅ Dark/Light theme
- ✅ Keyboard shortcuts (⌘K command palette)
- ✅ PWA support (installable)
- ✅ Responsive design
- ✅ Search across all entities

### Security
- ✅ NextAuth.js with JWT
- ✅ OAuth (Google, GitHub)
- ✅ Password hashing (bcrypt)
- ✅ Role-based access control
- ✅ Session management

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| CSS | Tailwind CSS + shadcn/ui |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| State | Zustand |
| Data | TanStack Query |
| Charts | Recharts |
| DnD | @dnd-kit |
| Real-time | Socket.io |
| Animations | Framer Motion |

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | Authentication |
| `/api/projects` | GET/POST | Projects CRUD |
| `/api/tasks` | GET/POST | Tasks CRUD |
| `/api/search` | GET | Global search |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘K` | Open command palette |
| `⌘B` | Toggle sidebar |
| `⌘/` | Show keyboard shortcuts |
