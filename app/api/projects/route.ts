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
  const status = searchParams.get("status");
  const archived = searchParams.get("archived") === "true";

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
      isArchived: archived,
      ...(status ? { status: status as any } : {}),
    },
    include: {
      team: { select: { id: true, name: true, color: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ data: projects });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { orgId, name, description, color, icon, status, isPublic, teamId } = body;

  if (!orgId || !name) {
    return NextResponse.json({ error: "orgId and name required" }, { status: 400 });
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership || membership.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const project = await db.project.create({
    data: {
      name,
      description,
      color: color || "#6366f1",
      icon: icon || "folder",
      status: status || "ON_TRACK",
      isPublic: isPublic ?? true,
      organizationId: orgId,
      teamId,
      createdBy: session.user.id,
      sections: {
        create: [
          { name: "To Do", position: 0 },
          { name: "In Progress", position: 1 },
          { name: "Done", position: 2 },
        ],
      },
    },
    include: { sections: true, _count: { select: { tasks: true } } },
  });

  return NextResponse.json({ data: project }, { status: 201 });
}
