"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function globalSearch(orgId: string, query: string) {
  const session = await auth();
  if (!session?.user?.id || !query.trim()) return { tasks: [], projects: [], pages: [], goals: [] };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return { tasks: [], projects: [], pages: [], goals: [] };

  const searchTerm = query.trim().toLowerCase();

  // Fetch all and filter in memory (SQLite doesn't support case-insensitive contains)
  const [allTasks, allProjects, allPages, allGoals] = await Promise.all([
    db.task.findMany({
      where: { organizationId: orgId },
      take: 100,
      include: {
        project: { select: { name: true, color: true } },
        assignments: {
          include: { member: { include: { user: { select: { name: true } } } } },
        },
      },
    }),
    db.project.findMany({
      where: { organizationId: orgId },
      take: 50,
      include: { _count: { select: { tasks: true } } },
    }),
    db.page.findMany({
      where: { organizationId: orgId },
      take: 50,
    }),
    db.goal.findMany({
      where: { organizationId: orgId },
      take: 50,
    }),
  ]);

  const tasks = allTasks
    .filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm)
    )
    .slice(0, 10);

  const projects = allProjects
    .filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
    )
    .slice(0, 5);

  const pages = allPages
    .filter((p) => p.title.toLowerCase().includes(searchTerm))
    .slice(0, 5);

  const goals = allGoals
    .filter(
      (g) =>
        g.title.toLowerCase().includes(searchTerm) ||
        g.description?.toLowerCase().includes(searchTerm)
    )
    .slice(0, 5);

  return { tasks, projects, pages, goals };
}
