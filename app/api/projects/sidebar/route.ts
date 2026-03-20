import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orgId = searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 });
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const projects = await db.project.findMany({
    where: {
      organizationId: orgId,
      isArchived: false,
    },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
    take: 10,
    select: {
      id: true,
      name: true,
      color: true,
      icon: true,
      isFavorite: true,
      status: true,
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json({ data: projects });
}
