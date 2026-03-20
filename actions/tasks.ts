"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createTaskSchema, updateTaskSchema } from "@/lib/validations";

export async function createTask(
  orgId: string,
  projectId: string,
  values: {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    startDate?: string | null;
    sectionId?: string | null;
    parentTaskId?: string | null;
    assigneeIds?: string[];
    labelIds?: string[];
    estimatedHours?: number | null;
    storyPoints?: number | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });

  if (!membership || membership.role === "VIEWER") {
    return { error: "Insufficient permissions" };
  }

  // Get last position
  const lastTask = await db.task.findFirst({
    where: {
      projectId,
      sectionId: values.sectionId ?? undefined,
      parentTaskId: values.parentTaskId ?? undefined,
    },
    orderBy: { position: "desc" },
  });

  const task = await db.task.create({
    data: {
      title: values.title,
      description: values.description,
      status: (values.status as any) || "TODO",
      priority: (values.priority as any) || "NONE",
      position: (lastTask?.position ?? 0) + 1,
      dueDate: values.dueDate ? new Date(values.dueDate) : null,
      startDate: values.startDate ? new Date(values.startDate) : null,
      estimatedHours: values.estimatedHours,
      storyPoints: values.storyPoints,
      organizationId: orgId,
      projectId,
      sectionId: values.sectionId,
      parentTaskId: values.parentTaskId,
      createdBy: session.user.id,
      assignments: values.assigneeIds?.length
        ? {
            create: values.assigneeIds.map((id) => ({
              memberId: id,
            })),
          }
        : undefined,
      labels: values.labelIds?.length
        ? {
            create: values.labelIds.map((id) => ({
              labelId: id,
            })),
          }
        : undefined,
    },
    include: {
      assignments: {
        include: { member: { include: { user: true } } },
      },
      labels: { include: { label: true } },
      section: true,
      _count: { select: { comments: true, subTasks: true } },
    },
  });

  // Log activity
  await db.taskActivity.create({
    data: {
      type: "CREATED",
      taskId: task.id,
      userId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/${orgId}/projects/${projectId}`);
  return { success: true, task };
}

export async function updateTask(
  orgId: string,
  projectId: string,
  taskId: string,
  values: {
    title?: string;
    description?: string | null;
    status?: string;
    priority?: string;
    dueDate?: string | null;
    startDate?: string | null;
    sectionId?: string | null;
    position?: number;
    estimatedHours?: number | null;
    storyPoints?: number | null;
    completedAt?: Date | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });

  if (!membership || membership.role === "VIEWER") {
    return { error: "Insufficient permissions" };
  }

  const updateData: Record<string, unknown> = { ...values };
  if (values.dueDate !== undefined) {
    updateData.dueDate = values.dueDate ? new Date(values.dueDate) : null;
  }
  if (values.startDate !== undefined) {
    updateData.startDate = values.startDate ? new Date(values.startDate) : null;
  }
  if (values.status === "DONE") {
    updateData.completedAt = new Date();
  }
  if (values.status && values.status !== "DONE") {
    updateData.completedAt = null;
  }

  const task = await db.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignments: {
        include: { member: { include: { user: true } } },
      },
      labels: { include: { label: true } },
      section: true,
      _count: { select: { comments: true, subTasks: true } },
    },
  });

  // Log activity
  if (values.status) {
    await db.taskActivity.create({
      data: {
        type: values.status === "DONE" ? "COMPLETED" : "STATUS_CHANGED",
        field: "status",
        newValue: values.status,
        taskId,
        userId: session.user.id,
      },
    });
  }

  revalidatePath(`/dashboard/${orgId}/projects/${projectId}`);
  revalidatePath(`/dashboard/${orgId}/tasks/${taskId}`);
  return { success: true, task };
}

export async function deleteTask(
  orgId: string,
  projectId: string,
  taskId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });

  if (!membership || membership.role === "VIEWER") {
    return { error: "Insufficient permissions" };
  }

  await db.task.delete({ where: { id: taskId } });

  revalidatePath(`/dashboard/${orgId}/projects/${projectId}`);
  return { success: true };
}

export async function moveTask(
  orgId: string,
  projectId: string,
  taskId: string,
  values: {
    sectionId?: string | null;
    position?: number;
    projectId?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });

  if (!membership || membership.role === "VIEWER") {
    return { error: "Insufficient permissions" };
  }

  await db.task.update({
    where: { id: taskId },
    data: {
      sectionId: values.sectionId,
      position: values.position,
      projectId: values.projectId,
    },
  });

  await db.taskActivity.create({
    data: {
      type: "MOVED",
      taskId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/${orgId}/projects/${projectId}`);
  return { success: true };
}

export async function assignTask(
  orgId: string,
  taskId: string,
  memberId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await db.taskAssignment.findUnique({
    where: {
      taskId_memberId: { taskId, memberId },
    },
  });

  if (existing) return { error: "Already assigned" };

  await db.taskAssignment.create({
    data: { taskId, memberId },
  });

  await db.taskActivity.create({
    data: {
      type: "ASSIGNED",
      taskId,
      userId: session.user.id,
    },
  });

  return { success: true };
}

export async function unassignTask(
  orgId: string,
  taskId: string,
  memberId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.taskAssignment.delete({
    where: {
      taskId_memberId: { taskId, memberId },
    },
  });

  await db.taskActivity.create({
    data: {
      type: "UNASSIGNED",
      taskId,
      userId: session.user.id,
    },
  });

  return { success: true };
}

export async function addTaskLabel(
  orgId: string,
  taskId: string,
  labelId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await db.taskLabel.findUnique({
    where: {
      taskId_labelId: { taskId, labelId },
    },
  });

  if (existing) return { error: "Label already added" };

  await db.taskLabel.create({
    data: { taskId, labelId },
  });

  await db.taskActivity.create({
    data: {
      type: "LABEL_ADDED",
      taskId,
      userId: session.user.id,
    },
  });

  return { success: true };
}

export async function removeTaskLabel(
  orgId: string,
  taskId: string,
  labelId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.taskLabel.delete({
    where: {
      taskId_labelId: { taskId, labelId },
    },
  });

  await db.taskActivity.create({
    data: {
      type: "LABEL_REMOVED",
      taskId,
      userId: session.user.id,
    },
  });

  return { success: true };
}

export async function getTask(orgId: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });

  if (!membership) return null;

  return db.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      section: true,
      parentTask: true,
      subTasks: {
        orderBy: { position: "asc" },
        include: {
          assignments: {
            include: { member: { include: { user: true } } },
          },
          _count: { select: { subTasks: true } },
        },
      },
      assignments: {
        include: { member: { include: { user: true } } },
      },
      labels: { include: { label: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        include: { author: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: true },
      },
      _count: {
        select: {
          comments: true,
          subTasks: true,
        },
      },
    },
  });
}

export async function getProjectTasks(orgId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });

  if (!membership) return [];

  return db.task.findMany({
    where: {
      projectId,
      parentTaskId: null,
    },
    orderBy: { position: "asc" },
    include: {
      assignments: {
        include: { member: { include: { user: true } } },
      },
      labels: { include: { label: true } },
      section: true,
      _count: {
        select: { comments: true, subTasks: true },
      },
    },
  });
}
