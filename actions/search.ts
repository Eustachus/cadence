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

  const searchTerm = query.trim();

  const [tasks, projects, pages, goals] = await Promise.all([
    db.task.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 10,
      include: {
        project: { select: { name: true, color: true } },
        assignments: {
          include: { member: { include: { user: { select: { name: true } } } } },
        },
      },
    }),
    db.project.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
      include: { _count: { select: { tasks: true } } },
    }),
    db.page.findMany({
      where: {
        organizationId: orgId,
        title: { contains: searchTerm, mode: "insensitive" },
      },
      take: 5,
    }),
    db.goal.findMany({
      where: {
        organizationId: orgId,
        OR: [
          { title: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      take: 5,
    }),
  ]);

  return { tasks, projects, pages, goals };
}
