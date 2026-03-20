"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createOrgSchema } from "@/lib/validations";
import { slugify, generateColor } from "@/lib/utils";
import { nanoid } from "nanoid";

export async function createOrganization(values: {
  name: string;
  slug?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const validated = createOrgSchema.safeParse({
    ...values,
    slug: values.slug || slugify(values.name),
  });
  if (!validated.success) return { error: "Invalid fields" };

  const { name, slug } = validated.data;

  const existingSlug = await db.organization.findUnique({ where: { slug } });
  if (existingSlug) return { error: "Organization slug already taken" };

  const org = await db.organization.create({
    data: {
      name,
      slug,
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  revalidatePath("/dashboard");
  return { success: true, organization: org };
}

export async function updateOrganization(
  orgId: string,
  values: {
    name?: string;
    description?: string | null;
    logo?: string | null;
    domain?: string | null;
    billingEmail?: string | null;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await getMembership(session.user.id, orgId);
  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return { error: "Insufficient permissions" };
  }

  const org = await db.organization.update({
    where: { id: orgId },
    data: values,
  });

  revalidatePath(`/dashboard/${orgId}/settings`);
  return { success: true, organization: org };
}

export async function deleteOrganization(orgId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const membership = await getMembership(session.user.id, orgId);
  if (!membership || membership.role !== "OWNER") {
    return { error: "Only the owner can delete the organization" };
  }

  await db.organization.delete({ where: { id: orgId } });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getOrganizations() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: { organization: true },
    orderBy: { createdAt: "desc" },
  });

  return memberships.map((m: typeof memberships[number]) => ({
    ...m.organization,
    role: m.role,
    membershipId: m.id,
  }));
}

export async function getOrganization(orgId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await getMembership(session.user.id, orgId);
  if (!membership) return null;

  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: {
          memberships: true,
          teams: true,
          projects: true,
        },
      },
    },
  });

  return org;
}

export async function transferOwnership(orgId: string, newOwnerId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const currentMembership = await getMembership(session.user.id, orgId);
  if (!currentMembership || currentMembership.role !== "OWNER") {
    return { error: "Only the current owner can transfer ownership" };
  }

  const newOwnerMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: newOwnerId,
        organizationId: orgId,
      },
    },
  });

  if (!newOwnerMembership) return { error: "New owner must be a member" };

  await db.$transaction([
    db.membership.update({
      where: { id: currentMembership.id },
      data: { role: "ADMIN" },
    }),
    db.membership.update({
      where: { id: newOwnerMembership.id },
      data: { role: "OWNER" },
    }),
  ]);

  revalidatePath(`/dashboard/${orgId}/settings`);
  return { success: true };
}

// ─── Helper ───

async function getMembership(userId: string, orgId: string) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: orgId,
      },
    },
  });
}
