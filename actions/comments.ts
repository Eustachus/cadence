"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createComment(
  orgId: string,
  taskId: string,
  body: string,
  parentId?: string | null
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return { error: "Not a member" };

  const comment = await db.comment.create({
    data: {
      body,
      taskId,
      authorId: session.user.id,
      parentId,
    },
    include: { author: true },
  });

  // Log activity
  await db.taskActivity.create({
    data: {
      type: "COMMENTED",
      taskId,
      userId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true, comment };
}

export async function updateComment(
  orgId: string,
  commentId: string,
  body: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!comment || comment.authorId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await db.comment.update({
    where: { id: commentId },
    data: { body },
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true };
}

export async function deleteComment(orgId: string, commentId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true },
  });

  if (!comment || comment.authorId !== session.user.id) {
    return { error: "Not authorized" };
  }

  await db.comment.delete({ where: { id: commentId } });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true };
}

export async function addReaction(
  orgId: string,
  commentId: string,
  emoji: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await db.commentReaction.findUnique({
    where: {
      commentId_userId_emoji: {
        commentId,
        userId: session.user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await db.commentReaction.delete({ where: { id: existing.id } });
  } else {
    await db.commentReaction.create({
      data: { commentId, userId: session.user.id, emoji },
    });
  }

  return { success: true };
}

export async function addTaskReaction(
  orgId: string,
  taskId: string,
  emoji: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  // Task reactions not available in this version
  return { success: true };
}

export async function getTaskComments(orgId: string, taskId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return [];

  return db.comment.findMany({
    where: { taskId, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, image: true } },
          reactions: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
      reactions: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
  });
}

export async function getActivityFeed(orgId: string, limit = 50) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return [];

  return db.taskActivity.findMany({
    where: {
      task: { organizationId: orgId },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, image: true } },
      task: { select: { id: true, title: true, projectId: true, project: { select: { name: true, color: true } } } },
    },
  });
}
