"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createPortfolio(
  orgId: string,
  values: {
    name: string;
    description?: string;
    color?: string;
    projectIds?: string[];
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

  const portfolio = await db.portfolio.create({
    data: {
      name: values.name,
      description: values.description,
      color: values.color || "#6366f1",
      organizationId: orgId,
      createdBy: session.user.id,
      projects: values.projectIds?.length
        ? {
            create: values.projectIds.map((projectId) => ({
              projectId,
            })),
          }
        : undefined,
    },
    include: {
      projects: {
        include: {
          project: {
            include: { _count: { select: { tasks: true } } },
          },
        },
      },
    },
  });

  revalidatePath(`/dashboard/${orgId}/portfolios`);
  return { success: true, portfolio };
}

export async function updatePortfolio(
  orgId: string,
  portfolioId: string,
  values: {
    name?: string;
    description?: string | null;
    color?: string;
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

  await db.portfolio.update({
    where: { id: portfolioId },
    data: values,
  });

  revalidatePath(`/dashboard/${orgId}/portfolios`);
  return { success: true };
}

export async function deletePortfolio(orgId: string, portfolioId: string) {
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

  await db.portfolio.delete({ where: { id: portfolioId } });

  revalidatePath(`/dashboard/${orgId}/portfolios`);
  return { success: true };
}

export async function addProjectToPortfolio(
  orgId: string,
  portfolioId: string,
  projectId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const existing = await db.portfolioProject.findUnique({
    where: {
      portfolioId_projectId: { portfolioId, projectId },
    },
  });

  if (existing) return { error: "Project already in portfolio" };

  await db.portfolioProject.create({
    data: { portfolioId, projectId },
  });

  revalidatePath(`/dashboard/${orgId}/portfolios`);
  return { success: true };
}

export async function removeProjectFromPortfolio(
  orgId: string,
  portfolioId: string,
  projectId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await db.portfolioProject.delete({
    where: {
      portfolioId_projectId: { portfolioId, projectId },
    },
  });

  revalidatePath(`/dashboard/${orgId}/portfolios`);
  return { success: true };
}

export async function getPortfolios(orgId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return [];

  return db.portfolio.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      projects: {
        include: {
          project: {
            include: {
              _count: { select: { tasks: true } },
              team: { select: { name: true, color: true } },
            },
          },
        },
      },
      _count: { select: { projects: true } },
    },
  });
}

export async function getPortfolio(orgId: string, portfolioId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) return null;

  return db.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      projects: {
        include: {
          project: {
            include: {
              tasks: {
                select: { status: true },
              },
              _count: { select: { tasks: true } },
              team: { select: { name: true, color: true } },
            },
          },
        },
      },
      _count: { select: { projects: true } },
    },
  });
}
