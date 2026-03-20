import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || searchParams.get("query");
  const orgId = searchParams.get("orgId");
  const type = searchParams.get("type") || "all";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

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

  const searchTerm = query.trim().toLowerCase();
  const results: Record<string, unknown[]> = {};

  if (type === "all" || type === "task") {
    const tasks = await db.task.findMany({
      where: { organizationId: orgId },
      take: 50,
      include: {
        project: { select: { name: true, color: true } },
      },
    });
    results.tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(searchTerm) ||
        t.description?.toLowerCase().includes(searchTerm)
    ).slice(0, 20);
  }

  if (type === "all" || type === "project") {
    const projects = await db.project.findMany({
      where: { organizationId: orgId },
      take: 50,
      include: { _count: { select: { tasks: true } } },
    });
    results.projects = projects.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description?.toLowerCase().includes(searchTerm)
    ).slice(0, 10);
  }

  if (type === "all" || type === "page") {
    const pages = await db.page.findMany({
      where: { organizationId: orgId },
      take: 50,
    });
    results.pages = pages
      .filter((p) => p.title.toLowerCase().includes(searchTerm))
      .slice(0, 10);
  }

  if (type === "all" || type === "goal") {
    const goals = await db.goal.findMany({
      where: { organizationId: orgId },
      take: 50,
    });
    results.goals = goals
      .filter(
        (g) =>
          g.title.toLowerCase().includes(searchTerm) ||
          g.description?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 10);
  }

  if (type === "all" || type === "member") {
    const memberships = await db.membership.findMany({
      where: { organizationId: orgId },
      include: { user: true },
      take: 50,
    });
    results.members = memberships
      .filter((m) =>
        m.user?.name?.toLowerCase().includes(searchTerm) ||
        m.user?.email?.toLowerCase().includes(searchTerm)
      )
      .map((m) => ({
        id: m.user?.id,
        name: m.user?.name,
        email: m.user?.email,
        image: m.user?.image,
      }))
      .slice(0, 10);
  }

  return NextResponse.json({ data: results, query: searchTerm });
}
