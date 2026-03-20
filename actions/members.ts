"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { inviteMemberSchema } from "@/lib/validations";
import { nanoid } from "nanoid";

export async function inviteMember(
  orgId: string,
  values: {
    email: string;
    role?: "ADMIN" | "MEMBER" | "VIEWER";
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

  const validated = inviteMemberSchema.safeParse({
    ...values,
    organizationId: orgId,
  });
  if (!validated.success) return { error: "Invalid fields" };

  const { email, role } = validated.data;

  // Check if already a member
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: orgId,
        },
      },
    });
    if (existingMembership) return { error: "User is already a member" };
  }

  // Check for pending invite
  const pendingInvite = await db.membership.findFirst({
    where: {
      invitedEmail: email,
      organizationId: orgId,
      inviteExpires: { gt: new Date() },
    },
  });
  if (pendingInvite) return { error: "Invitation already pending" };

  const inviteToken = nanoid(32);
  const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const membershipRecord = await db.membership.create({
    data: {
      role,
      userId: existingUser?.id || session.user.id, // Temporary
      organizationId: orgId,
      invitedEmail: email,
      inviteToken,
      inviteExpires,
    },
  });

  // If user already exists, link directly
  if (existingUser) {
    await db.membership.update({
      where: { id: membershipRecord.id },
      data: { userId: existingUser.id },
    });
  }

  // TODO: Send invitation email
  // await sendInviteEmail(email, inviteToken, org.name);

  revalidatePath(`/dashboard/${orgId}/settings`);
  return { success: true, inviteToken };
}

export async function acceptInvite(inviteToken: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invite = await db.membership.findUnique({
    where: { inviteToken },
    include: { organization: true },
  });

  if (!invite) return { error: "Invalid invitation" };
  if (invite.inviteExpires && invite.inviteExpires < new Date()) {
    return { error: "Invitation has expired" };
  }

  await db.membership.update({
    where: { id: invite.id },
    data: {
      userId: session.user.id,
      inviteToken: null,
      inviteExpires: null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true, organization: invite.organization };
}

export async function cancelInvite(orgId: string, inviteId: string) {
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

  await db.membership.delete({ where: { id: inviteId } });

  revalidatePath(`/dashboard/${orgId}/settings`);
  return { success: true };
}

export async function removeMember(orgId: string, memberId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const currentMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });

  if (!currentMembership || !["OWNER", "ADMIN"].includes(currentMembership.role)) {
    return { error: "Insufficient permissions" };
  }

  const targetMembership = await db.membership.findUnique({
    where: { id: memberId },
  });

  if (!targetMembership || targetMembership.organizationId !== orgId) {
    return { error: "Member not found" };
  }

  if (targetMembership.role === "OWNER") {
    return { error: "Cannot remove the owner" };
  }

  // Can't remove members with equal or higher role (unless owner)
  if (currentMembership.role !== "OWNER") {
    if (["ADMIN"].includes(targetMembership.role)) {
      return { error: "Cannot remove members with equal role" };
    }
  }

  await db.membership.delete({ where: { id: memberId } });

  revalidatePath(`/dashboard/${orgId}/settings`);
  return { success: true };
}

export async function updateMemberRole(
  orgId: string,
  memberId: string,
  role: "ADMIN" | "MEMBER" | "VIEWER"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const currentMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId: orgId,
      },
    },
  });

  if (!currentMembership || currentMembership.role !== "OWNER") {
    return { error: "Only owners can change roles" };
  }

  await db.membership.update({
    where: { id: memberId },
    data: { role },
  });

  revalidatePath(`/dashboard/${orgId}/settings`);
  return { success: true };
}

export async function getMembers(orgId: string) {
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

  const members = await db.membership.findMany({
    where: { organizationId: orgId },
    include: { user: true },
    orderBy: [
      { role: "asc" }, // OWNER first
      { createdAt: "asc" },
    ],
  });

  return members;
}

export async function getPendingInvites(orgId: string) {
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

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return [];
  }

  const invites = await db.membership.findMany({
    where: {
      organizationId: orgId,
      inviteToken: { not: null },
      inviteExpires: { gt: new Date() },
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return invites;
}

export async function leaveOrganization(orgId: string) {
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

  if (!membership) return { error: "Not a member" };
  if (membership.role === "OWNER") {
    return { error: "Owners cannot leave. Transfer ownership first." };
  }

  await db.membership.delete({ where: { id: membership.id } });

  revalidatePath("/dashboard");
  return { success: true };
}
