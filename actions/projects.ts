"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createProjectSchema } from "@/lib/validations";

export async function createProject(
  orgId: string,
  values: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    status?: "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "ON_HOLD" | "COMPLETE";
    isPublic?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    teamId?: string | null;
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

  const validated = createProjectSchema.safeParse({
    ...values,
    organizationId: orgId,
  });
  if (!validated.success) return { error: "Invalid fields" };

  const project = await db.project.create({
    data: {
      name: validated.data.name,
      description: validated.data.description,
      icon: validated.data.icon || "folder",
      color: validated.data.color || "#6366f1",
      status: validated.data.status || "ON_TRACK",
      isPublic: validated.data.isPublic ?? true,
      startDate: validated.data.startDate ? new Date(validated.data.startDate) : null,
      endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
      organizationId: orgId,
      teamId: validated.data.teamId,
      createdBy: session.user.id,
      sections: {
        create: [
          { name: "To Do", position: 0 },
          { name: "In Progress", position: 1 },
          { name: "Done", position: 2 },
        ],
      },
    },
    include: {
      sections: true,
      _count: { select: { tasks: true } },
    },
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true, project };
}

export async function updateProject(
  orgId: string,
  projectId: string,
  values: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    color?: string;
    status?: "ON_TRACK" | "AT_RISK" | "OFF_TRACK" | "ON_HOLD" | "COMPLETE";
    isPublic?: boolean;
    isFavorite?: boolean;
    isArchived?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    teamId?: string | null;
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
  if (values.startDate !== undefined) {
    updateData.startDate = values.startDate ? new Date(values.startDate) : null;
  }
  if (values.endDate !== undefined) {
    updateData.endDate = values.endDate ? new Date(values.endDate) : null;
  }

  const project = await db.project.update({
    where: { id: projectId },
    data: updateData,
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  revalidatePath(`/dashboard/${orgId}/projects/${projectId}`);
  return { success: true, project };
}

export async function deleteProject(orgId: string, projectId: string) {
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

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return { error: "Insufficient permissions" };
  }

  await db.project.delete({ where: { id: projectId } });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true };
}

export async function duplicateProject(orgId: string, projectId: string) {
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

  const original = await db.project.findUnique({
    where: { id: projectId },
    include: { sections: true },
  });

  if (!original) return { error: "Project not found" };

  const duplicate = await db.project.create({
    data: {
      name: `${original.name} (Copy)`,
      description: original.description,
      icon: original.icon,
      color: original.color,
      status: "ON_TRACK",
      isPublic: original.isPublic,
      organizationId: orgId,
      teamId: original.teamId,
      createdBy: session.user.id,
      sections: {
        create: original.sections.map((s: typeof original.sections[number]) => ({
          name: s.name,
          position: s.position,
        })),
      },
    },
    include: { sections: true, _count: { select: { tasks: true } } },
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true, project: duplicate };
}

export async function archiveProject(orgId: string, projectId: string, archive: boolean) {
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

  await db.project.update({
    where: { id: projectId },
    data: { isArchived: archive },
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true };
}

export async function toggleFavorite(orgId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { isFavorite: true },
  });

  if (!project) return { error: "Project not found" };

  await db.project.update({
    where: { id: projectId },
    data: { isFavorite: !project.isFavorite },
  });

  revalidatePath(`/dashboard/${orgId}/projects`);
  return { success: true };
}

export async function getProjects(orgId: string, archived = false) {
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

  const projects = await db.project.findMany({
    where: {
      organizationId: orgId,
      isArchived: archived,
      ...(membership.role === "VIEWER" ? { isPublic: true } : {}),
    },
    include: {
      team: true,
      sections: {
        orderBy: { position: "asc" },
      },
      _count: {
        select: { tasks: true },
      },
    },
    orderBy: [
      { isPinned: "desc" },
      { isFavorite: "desc" },
      { updatedAt: "desc" },
    ],
  });

  return projects;
}

export async function getProject(orgId: string, projectId: string) {
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

  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      team: true,
      sections: {
        orderBy: { position: "asc" },
        include: {
          tasks: {
            orderBy: { position: "asc" },
            include: {
              assignments: {
                include: {
                  member: {
                    include: { user: true },
                  },
                },
              },
              labels: {
                include: { label: true },
              },
              _count: {
                select: { comments: true, subTasks: true },
              },
            },
          },
        },
      },
      tasks: {
        where: { parentTaskId: null },
        orderBy: { position: "asc" },
        include: {
          assignments: {
            include: {
              member: {
                include: { user: true },
              },
            },
          },
          labels: {
            include: { label: true },
          },
          section: true,
          _count: {
            select: { comments: true, subTasks: true },
          },
        },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  return project;
}

export async function getProjectSections(orgId: string, projectId: string) {
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

  return db.section.findMany({
    where: { projectId },
    orderBy: { position: "asc" },
  });
}

export async function createSection(
  orgId: string,
  projectId: string,
  name: string
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

  const lastSection = await db.section.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
  });

  const section = await db.section.create({
    data: {
      name,
      position: (lastSection?.position ?? 0) + 1,
      projectId,
    },
  });

  revalidatePath(`/dashboard/${orgId}/projects/${projectId}`);
  return { success: true, section };
}

export async function updateSection(
  orgId: string,
  projectId: string,
  sectionId: string,
  values: { name?: string; position?: number }
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

  await db.section.update({
    where: { id: sectionId },
    data: values,
  });

  revalidatePath(`/dashboard/${orgId}/projects/${projectId}`);
  return { success: true };
}

export async function deleteSection(
  orgId: string,
  projectId: string,
  sectionId: string
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

  // Move tasks to no section before deleting
  await db.task.updateMany({
    where: { sectionId },
    data: { sectionId: null },
  });

  await db.section.delete({ where: { id: sectionId } });

  revalidatePath(`/dashboard/${orgId}/projects/${projectId}`);
  return { success: true };
}
