"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getMyTasks(orgId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { today: [], upcoming: [], later: [], overdue: [] };

  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  // Get all memberships
  const memberships = await db.membership.findMany({
    where: {
      userId: session.user.id,
      ...(orgId ? { organizationId: orgId } : {}),
    },
  });

  const memberIds = memberships.map((m) => m.id);
  if (memberIds.length === 0) return { today: [], upcoming: [], later: [], overdue: [] };

  const tasks = await db.task.findMany({
    where: {
      assignments: { some: { memberId: { in: memberIds } } },
      status: { notIn: ["DONE", "CANCELLED"] },
    },
    orderBy: [{ dueDate: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
    include: {
      project: { select: { id: true, name: true, color: true } },
      assignments: {
        include: { member: { include: { user: true } } },
      },
      labels: { include: { label: true } },
      _count: { select: { comments: true, subTasks: true } },
    },
  });

  const today: typeof tasks = [];
  const upcoming: typeof tasks = [];
  const later: typeof tasks = [];
  const overdue: typeof tasks = [];

  tasks.forEach((task) => {
    if (!task.dueDate) {
      later.push(task);
    } else if (new Date(task.dueDate) < now) {
      overdue.push(task);
    } else if (new Date(task.dueDate) <= endOfToday) {
      today.push(task);
    } else if (new Date(task.dueDate) <= endOfWeek) {
      upcoming.push(task);
    } else {
      later.push(task);
    }
  });

  return { today, upcoming, later, overdue };
}

export async function getMyTaskStats(orgId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { total: 0, completed: 0, overdue: 0, streak: 0 };

  const memberships = await db.membership.findMany({
    where: {
      userId: session.user.id,
      ...(orgId ? { organizationId: orgId } : {}),
    },
  });

  const memberIds = memberships.map((m) => m.id);

  const [total, completed, overdue] = await Promise.all([
    db.task.count({
      where: { assignments: { some: { memberId: { in: memberIds } } } },
    }),
    db.task.count({
      where: {
        assignments: { some: { memberId: { in: memberIds } } },
        status: "DONE",
      },
    }),
    db.task.count({
      where: {
        assignments: { some: { memberId: { in: memberIds } } },
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { lt: new Date() },
      },
    }),
  ]);

  // Calculate streak (consecutive days with completed tasks)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { streak: true },
  });

  return { total, completed, overdue, streak: user?.streak || 0 };
}
