"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPage(
  orgId: string,
  values: {
    title: string;
    content?: unknown;
    icon?: string;
    parentId?: string | null;
    isPublic?: boolean;
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

  const page = await db.page.create({
    data: {
      title: values.title,
      content: values.content as any,
      icon: values.icon || "file-text",
      parentId: values.parentId,
      isPublic: values.isPublic ?? false,
      organizationId: orgId,
      createdBy: session.user.id,
    },
  });

  revalidatePath(`/dashboard/${orgId}/pages`);
  return { success: true, page };
}

export async function updatePage(
  orgId: string,
  pageId: string,
  values: {
    title?: string;
    content?: unknown;
    icon?: string | null;
    coverImage?: string | null;
    isPublic?: boolean;
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

  // Save version before update
  const current = await db.page.findUnique({
    where: { id: pageId },
    select: { title: true, content: true },
  });

  if (current && (values.title !== undefined || values.content !== undefined)) {
    await db.pageVersion.create({
      data: {
        title: current.title,
        content: current.content as any,
        pageId,
        userId: session.user.id,
      },
    });
  }

  await db.page.update({
    where: { id: pageId },
    data: {
      ...values,
      content: values.content as any,
    },
  });

  revalidatePath(`/dashboard/${orgId}/pages`);
  revalidatePath(`/dashboard/${orgId}/pages/${pageId}`);
  return { success: true };
}

export async function deletePage(orgId: string, pageId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return { error: "Insufficient permissions" };
  }

  await db.page.delete({ where: { id: pageId } });

  revalidatePath(`/dashboard/${orgId}/pages`);
  return { success: true };
}

export async function getPages(orgId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return [];

  return db.page.findMany({
    where: { organizationId: orgId, parentId: null },
    orderBy: { updatedAt: "desc" },
    include: {
      children: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { children: true } },
        },
      },
      creator: { select: { id: true, name: true, image: true } },
      _count: { select: { children: true, comments: true } },
    },
  });
}

export async function getPage(orgId: string, pageId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return null;

  return db.page.findUnique({
    where: { id: pageId },
    include: {
      parent: { select: { id: true, title: true } },
      children: {
        orderBy: { updatedAt: "desc" },
        include: {
          _count: { select: { children: true } },
        },
      },
      creator: { select: { id: true, name: true, image: true } },
      comments: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: true },
      },
      versions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { children: true, comments: true } },
    },
  });
}

export async function addPageComment(
  orgId: string,
  pageId: string,
  body: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.pageComment.create({
    data: {
      body,
      pageId,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/dashboard/${orgId}/pages/${pageId}`);
  return { success: true };
}
