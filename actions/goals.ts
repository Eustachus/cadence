"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createGoal(
  orgId: string,
  values: {
    title: string;
    description?: string;
    period?: string;
    startDate: string;
    endDate: string;
    parentId?: string | null;
    keyResults?: Array<{
      title: string;
      type: string;
      startValue: number;
      targetValue: number;
      unit?: string;
    }>;
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

  const goal = await db.goal.create({
    data: {
      title: values.title,
      description: values.description,
      period: (values.period as any) || "QUARTER",
      startDate: new Date(values.startDate),
      endDate: new Date(values.endDate),
      parentId: values.parentId,
      organizationId: orgId,
      createdBy: session.user.id,
      keyResults: values.keyResults?.length
        ? {
            create: values.keyResults.map((kr) => ({
              title: kr.title,
              type: kr.type as any,
              startValue: kr.startValue,
              targetValue: kr.targetValue,
              unit: kr.unit,
            })),
          }
        : undefined,
    },
    include: { keyResults: true },
  });

  revalidatePath(`/dashboard/${orgId}/goals`);
  return { success: true, goal };
}

export async function updateGoal(
  orgId: string,
  goalId: string,
  values: {
    title?: string;
    description?: string | null;
    status?: string;
    period?: string;
    startDate?: string;
    endDate?: string;
    parentId?: string | null;
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

  const updateData: Record<string, unknown> = { ...values };
  if (values.startDate) updateData.startDate = new Date(values.startDate);
  if (values.endDate) updateData.endDate = new Date(values.endDate);

  await db.goal.update({
    where: { id: goalId },
    data: updateData,
  });

  revalidatePath(`/dashboard/${orgId}/goals`);
  return { success: true };
}

export async function deleteGoal(orgId: string, goalId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) return { error: "Insufficient permissions" };

  await db.goal.delete({ where: { id: goalId } });

  revalidatePath(`/dashboard/${orgId}/goals`);
  return { success: true };
}

export async function updateKeyResult(
  orgId: string,
  keyResultId: string,
  values: {
    currentValue?: number;
    status?: string;
    title?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.keyResult.update({
    where: { id: keyResultId },
    data: {
      currentValue: values.currentValue,
      status: values.status as any,
      title: values.title,
    },
  });

  // Auto-calculate goal progress
  const kr = await db.keyResult.findUnique({
    where: { id: keyResultId },
    select: { goalId: true },
  });

  if (kr) {
    const allKRs = await db.keyResult.findMany({
      where: { goalId: kr.goalId },
    });

    const totalProgress = allKRs.reduce((sum, k) => {
      const range = k.targetValue - k.startValue;
      if (range === 0) return sum + (k.currentValue >= k.targetValue ? 100 : 0);
      const progress = ((k.currentValue - k.startValue) / range) * 100;
      return sum + Math.min(Math.max(progress, 0), 100);
    }, 0);

    const avgProgress = totalProgress / allKRs.length;
    let goalStatus = "ON_TRACK";
    if (avgProgress >= 100) goalStatus = "ACHIEVED";
    else if (avgProgress < 30) goalStatus = "AT_RISK";
    else if (avgProgress < 10) goalStatus = "OFF_TRACK";

    await db.goal.update({
      where: { id: kr.goalId },
      data: { status: goalStatus as any },
    });
  }

  revalidatePath(`/dashboard/${orgId}/goals`);
  return { success: true };
}

export async function addGoalCheckIn(
  orgId: string,
  goalId: string,
  values: {
    note?: string;
    status: string;
    progress?: number;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.goalCheckIn.create({
    data: {
      note: values.note,
      status: values.status as any,
      progress: values.progress,
      goalId,
      userId: session.user.id,
    },
  });

  await db.goal.update({
    where: { id: goalId },
    data: { status: values.status as any },
  });

  revalidatePath(`/dashboard/${orgId}/goals`);
  return { success: true };
}

export async function getGoals(orgId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return [];

  return db.goal.findMany({
    where: { organizationId: orgId, parentId: null },
    orderBy: { createdAt: "desc" },
    include: {
      keyResults: true,
      children: {
        include: {
          keyResults: true,
          _count: { select: { children: true } },
        },
      },
      checkIns: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { user: true },
      },
      _count: {
        select: { keyResults: true, children: true },
      },
    },
  });
}

export async function getGoal(orgId: string, goalId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return null;

  return db.goal.findUnique({
    where: { id: goalId },
    include: {
      keyResults: true,
      parent: true,
      children: {
        include: {
          keyResults: true,
          _count: { select: { keyResults: true, children: true } },
        },
      },
      checkIns: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: true },
      },
      _count: {
        select: { keyResults: true, children: true },
      },
    },
  });
}
