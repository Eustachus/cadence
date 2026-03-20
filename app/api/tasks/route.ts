import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const orgId = searchParams.get("orgId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const assigneeId = searchParams.get("assigneeId");

  if (!projectId && !orgId) {
    return NextResponse.json({ error: "projectId or orgId required" }, { status: 400 });
  }

  const where: Record<string, unknown> = {};
  if (projectId) where.projectId = projectId;
  if (orgId) where.organizationId = orgId;
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) {
    where.assignments = { some: { memberId: assigneeId } };
  }

  const tasks = await db.task.findMany({
    where,
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    include: {
      assignments: {
        include: { member: { include: { user: { select: { id: true, name: true, image: true } } } } },
      },
      labels: { include: { label: true } },
      section: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, color: true } },
      _count: { select: { comments: true, subTasks: true } },
    },
  });

  return NextResponse.json({ data: tasks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { projectId, orgId, title, description, status, priority, sectionId, dueDate, assigneeIds } = body;

  if (!projectId || !title || !orgId) {
    return NextResponse.json({ error: "projectId, title, and orgId required" }, { status: 400 });
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId: session.user.id, organizationId: orgId },
    },
  });

  if (!membership || membership.role === "VIEWER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const lastTask = await db.task.findFirst({
    where: { projectId, sectionId: sectionId || undefined },
    orderBy: { position: "desc" },
  });

  const task = await db.task.create({
    data: {
      title,
      description,
      status: status || "TODO",
      priority: priority || "NONE",
      position: (lastTask?.position ?? 0) + 1,
      dueDate: dueDate ? new Date(dueDate) : null,
      organizationId: orgId,
      projectId,
      sectionId,
      createdBy: session.user.id,
      assignments: assigneeIds?.length
        ? { create: assigneeIds.map((id: string) => ({ memberId: id })) }
        : undefined,
    },
    include: {
      assignments: { include: { member: { include: { user: true } } } },
      labels: { include: { label: true } },
      section: true,
      _count: { select: { comments: true, subTasks: true } },
    },
  });

  return NextResponse.json({ data: task }, { status: 201 });
}
