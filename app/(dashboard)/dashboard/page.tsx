import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  FolderKanban,
  TrendingUp,
  Plus,
  ArrowRight,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { getOrganizations } from "@/actions/organizations";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const organizations = await getOrganizations();

  const stats = [
    {
      title: "Total Tasks",
      value: "0",
      description: "Tasks across all projects",
      icon: CheckCircle2,
      color: "text-blue-500",
    },
    {
      title: "In Progress",
      value: "0",
      description: "Tasks being worked on",
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      title: "Projects",
      value: "0",
      description: "Active projects",
      icon: FolderKanban,
      color: "text-green-500",
    },
    {
      title: "Completed",
      value: "0",
      description: "Tasks completed this week",
      icon: TrendingUp,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{session.user.name ? `, ${session.user.name}` : ""}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your projects today.
        </p>
      </div>

      {/* Workspaces */}
      {organizations.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Workspaces</CardTitle>
                <CardDescription>
                  Select a workspace to manage projects and teams.
                </CardDescription>
              </div>
              <Link href="/dashboard/new">
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {organizations.map((org: typeof organizations[number]) => (
                <Link key={org.id} href={`/dashboard/${org.id}`}>
                  <div className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        /{org.slug}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {org.role}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No workspaces yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create a workspace to get started with Cadence.
            </p>
            <Link href="/dashboard/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Workspace
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started quickly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/new">
              <Button variant="outline" className="w-full justify-start">
                <Building2 className="mr-2 h-4 w-4" />
                Create a workspace
              </Button>
            </Link>
            <Link href="/my-tasks">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                View my tasks
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="mr-2 h-4 w-4" />
                Account settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No recent activity yet
              </p>
              <p className="text-xs text-muted-foreground">
                Start by creating a workspace and project
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
