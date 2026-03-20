"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getNotifications(orgId?: string, unreadOnly = false) {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.notification.findMany({
    where: {
      userId: session.user.id,
      ...(orgId ? { orgId } : {}),
      ...(unreadOnly ? { read: false } : {}),
      archived: false,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getUnreadCount(orgId?: string) {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return db.notification.count({
    where: {
      userId: session.user.id,
      ...(orgId ? { orgId } : {}),
      read: false,
      archived: false,
    },
  });
}

export async function markAsRead(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });

  revalidatePath("/inbox");
  return { success: true };
}

export async function markAllAsRead(orgId?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.notification.updateMany({
    where: {
      userId: session.user.id,
      ...(orgId ? { orgId } : {}),
      read: false,
    },
    data: { read: true },
  });

  revalidatePath("/inbox");
  return { success: true };
}

export async function archiveNotification(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.notification.update({
    where: { id: notificationId },
    data: { archived: true },
  });

  revalidatePath("/inbox");
  return { success: true };
}

export async function createNotification(values: {
  type: string;
  title: string;
  body?: string;
  link?: string;
  userId: string;
  orgId: string;
}) {
  const notification = await db.notification.create({
    data: {
      type: values.type as any,
      title: values.title,
      body: values.body,
      link: values.link,
      userId: values.userId,
      orgId: values.orgId,
    },
  });

  return notification;
}

export async function deleteNotification(notificationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.notification.delete({ where: { id: notificationId } });

  revalidatePath("/inbox");
  return { success: true };
}
