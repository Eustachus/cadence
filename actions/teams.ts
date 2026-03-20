"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createTeamSchema } from "@/lib/validations";

export async function createTeam(
  orgId: string,
  values: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
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

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return { error: "Insufficient permissions" };
  }

  const validated = createTeamSchema.safeParse({
    ...values,
    organizationId: orgId,
  });
  if (!validated.success) return { error: "Invalid fields" };

  const team = await db.team.create({
    data: {
      name: validated.data.name,
      description: validated.data.description,
      color: validated.data.color || "#6366f1",
      organizationId: orgId,
      members: {
        create: {
          memberId: membership.id,
          role: "ADMIN",
        },
      },
    },
    include: {
      members: {
        include: {
          member: {
            include: { user: true },
          },
        },
      },
    },
  });

  revalidatePath(`/dashboard/${orgId}/teams`);
  return { success: true, team };
}

export async function updateTeam(
  orgId: string,
  teamId: string,
  values: {
    name?: string;
    description?: string | null;
    icon?: string | null;
    color?: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await checkTeamAccess(session.user.id, orgId, teamId, [
    "OWNER",
    "ADMIN",
  ]);
  if (!membership) return { error: "Insufficient permissions" };

  const team = await db.team.update({
    where: { id: teamId },
    data: values,
  });

  revalidatePath(`/dashboard/${orgId}/teams`);
  return { success: true, team };
}

export async function deleteTeam(orgId: string, teamId: string) {
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

  await db.team.delete({ where: { id: teamId } });

  revalidatePath(`/dashboard/${orgId}/teams`);
  return { success: true };
}

export async function getTeams(orgId: string) {
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

  const teams = await db.team.findMany({
    where: { organizationId: orgId },
    include: {
      members: {
        include: {
          member: {
            include: { user: true },
          },
        },
      },
      _count: {
        select: { projects: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return teams;
}

export async function getTeam(orgId: string, teamId: string) {
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

  const team = await db.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        include: {
          member: {
            include: { user: true },
          },
        },
      },
      projects: true,
      _count: {
        select: { projects: true },
      },
    },
  });

  return team;
}

export async function addTeamMember(
  orgId: string,
  teamId: string,
  memberId: string,
  role: "ADMIN" | "MEMBER" | "OBSERVER" = "MEMBER"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const access = await checkTeamAccess(session.user.id, orgId, teamId, [
    "OWNER",
    "ADMIN",
  ]);
  if (!access) return { error: "Insufficient permissions" };

  // Check if membership exists in org
  const targetMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: orgId,
      },
    },
  });

  if (!targetMembership) return { error: "User is not a member of the organization" };

  const existing = await db.teamMember.findUnique({
    where: {
      teamId_memberId: {
        teamId,
        memberId: targetMembership.id,
      },
    },
  });

  if (existing) return { error: "User is already a team member" };

  await db.teamMember.create({
    data: {
      teamId,
      memberId: targetMembership.id,
      role,
    },
  });

  revalidatePath(`/dashboard/${orgId}/teams`);
  return { success: true };
}

export async function removeTeamMember(
  orgId: string,
  teamId: string,
  memberId: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const access = await checkTeamAccess(session.user.id, orgId, teamId, [
    "OWNER",
    "ADMIN",
  ]);
  if (!access) return { error: "Insufficient permissions" };

  const targetMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: orgId,
      },
    },
  });

  if (!targetMembership) return { error: "User not found" };

  await db.teamMember.delete({
    where: {
      teamId_memberId: {
        teamId,
        memberId: targetMembership.id,
      },
    },
  });

  revalidatePath(`/dashboard/${orgId}/teams`);
  return { success: true };
}

export async function updateTeamMemberRole(
  orgId: string,
  teamId: string,
  memberId: string,
  role: "ADMIN" | "MEMBER" | "OBSERVER"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const access = await checkTeamAccess(session.user.id, orgId, teamId, [
    "OWNER",
    "ADMIN",
  ]);
  if (!access) return { error: "Insufficient permissions" };

  const targetMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: memberId,
        organizationId: orgId,
      },
    },
  });

  if (!targetMembership) return { error: "User not found" };

  await db.teamMember.update({
    where: {
      teamId_memberId: {
        teamId,
        memberId: targetMembership.id,
      },
    },
    data: { role },
  });

  revalidatePath(`/dashboard/${orgId}/teams`);
  return { success: true };
}

// ─── Helpers ───

async function checkTeamAccess(
  userId: string,
  orgId: string,
  teamId: string,
  allowedRoles: string[]
) {
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId: orgId },
    },
  });

  if (!membership) return null;

  // Org owners/admins always have access
  if (["OWNER", "ADMIN"].includes(membership.role)) return membership;

  // Check team role
  const teamMember = await db.teamMember.findUnique({
    where: {
      teamId_memberId: { teamId, memberId: membership.id },
    },
  });

  if (!teamMember || !allowedRoles.includes(teamMember.role)) return null;

  return membership;
}
