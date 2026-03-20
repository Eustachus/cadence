"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createTimeEntry(
  orgId: string,
  values: {
    taskId: string;
    description?: string;
    hours: number;
    date: string;
    billable?: boolean;
    hourlyRate?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership || membership.role === "VIEWER") return { error: "Insufficient permissions" };

  const entry = await db.timeEntry.create({
    data: {
      description: values.description,
      hours: values.hours,
      date: new Date(values.date),
      billable: values.billable ?? false,
      hourlyRate: values.hourlyRate,
      taskId: values.taskId,
      userId: session.user.id,
    },
    include: {
      task: { select: { id: true, title: true, projectId: true } },
      user: { select: { id: true, name: true, image: true } },
    },
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true, entry };
}

export async function updateTimeEntry(
  orgId: string,
  entryId: string,
  values: {
    description?: string;
    hours?: number;
    date?: string;
    billable?: boolean;
    hourlyRate?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const updateData: Record<string, unknown> = { ...values };
  if (values.date) updateData.date = new Date(values.date);

  await db.timeEntry.update({
    where: { id: entryId },
    data: updateData,
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true };
}

export async function deleteTimeEntry(orgId: string, entryId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.timeEntry.delete({ where: { id: entryId } });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true };
}

export async function getTimeEntries(
  orgId: string,
  filters?: {
    taskId?: string;
    projectId?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return [];

  const where: Record<string, unknown> = {};
  if (filters?.taskId) where.taskId = filters.taskId;
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) (where.date as any).gte = new Date(filters.startDate);
    if (filters.endDate) (where.date as any).lte = new Date(filters.endDate);
  }

  // If filtering by project, get tasks first
  if (filters?.projectId) {
    const tasks = await db.task.findMany({
      where: { projectId: filters.projectId },
      select: { id: true },
    });
    where.taskId = { in: tasks.map((t) => t.id) };
  }

  return db.timeEntry.findMany({
    where,
    orderBy: { date: "desc" },
    take: 100,
    include: {
      task: { select: { id: true, title: true, projectId: true, project: { select: { name: true, color: true } } } },
      user: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function getTimeReport(orgId: string, startDate: string, endDate: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return null;

  const entries = await db.timeEntry.findMany({
    where: {
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          project: { select: { id: true, name: true, color: true } },
        },
      },
      user: { select: { id: true, name: true } },
    },
  });

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  const billableHours = entries.filter((e) => e.billable).reduce((sum, e) => sum + e.hours, 0);
  const totalCost = entries
    .filter((e) => e.billable && e.hourlyRate)
    .reduce((sum, e) => sum + e.hours * (e.hourlyRate || 0), 0);

  // Group by project
  const byProject = entries.reduce((acc, e) => {
    const projectName = e.task.project?.name || "Unknown";
    if (!acc[projectName]) acc[projectName] = 0;
    acc[projectName] += e.hours;
    return acc;
  }, {} as Record<string, number>);

  // Group by user
  const byUser = entries.reduce((acc, e) => {
    const userName = e.user.name || "Unknown";
    if (!acc[userName]) acc[userName] = 0;
    acc[userName] += e.hours;
    return acc;
  }, {} as Record<string, number>);

  // Group by date
  const byDate = entries.reduce((acc, e) => {
    const key = new Date(e.date).toISOString().split("T")[0];
    if (!acc[key]) acc[key] = 0;
    acc[key] += e.hours;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalHours,
    billableHours,
    totalCost,
    entryCount: entries.length,
    byProject,
    byUser,
    byDate,
    entries: entries.slice(0, 50),
  };
}
