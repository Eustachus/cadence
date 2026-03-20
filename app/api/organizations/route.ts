import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await db.membership.findMany({
    where: { userId: session.user.id },
    include: {
      organization: {
        include: {
          _count: {
            select: {
              projects: true,
              teams: true,
              memberships: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const organizations = memberships.map((m) => ({
    ...m.organization,
    role: m.role,
  }));

  return NextResponse.json({ data: organizations });
}
