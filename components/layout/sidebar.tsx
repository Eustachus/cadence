"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/use-ui-store";
import {
  Home,
  CheckCircle2,
  Inbox,
  FolderKanban,
  Target,
  BarChart3,
  Search,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Users,
  FileText,
  Building2,
  Check,
  Palette,
  Loader2,
  Briefcase,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface SidebarProps {
  organizations?: Organization[];
  currentOrgId?: string;
}

export function Sidebar({ organizations = [], currentOrgId }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const currentOrg = organizations.find((o) => o.id === currentOrgId);

  const mainNav = currentOrgId
    ? [
        { href: `/dashboard`, label: "Home", icon: Home },
        { href: `/my-tasks`, label: "My Tasks", icon: CheckCircle2 },
        { href: `/inbox`, label: "Inbox", icon: Inbox },
      ]
    : [{ href: `/dashboard`, label: "Home", icon: Home }];

  const orgNav = currentOrgId
    ? [
        { href: `/dashboard/${currentOrgId}/projects`, label: "Projects", icon: FolderKanban },
        { href: `/dashboard/${currentOrgId}/portfolios`, label: "Portfolios", icon: Briefcase },
        { href: `/dashboard/${currentOrgId}/goals`, label: "Goals", icon: Target },
        { href: `/dashboard/${currentOrgId}/teams`, label: "Teams", icon: Users },
        { href: `/dashboard/${currentOrgId}/reporting`, label: "Reporting", icon: BarChart3 },
        { href: `/dashboard/${currentOrgId}/pages`, label: "Pages", icon: FileText },
        { href: `/dashboard/${currentOrgId}/forms`, label: "Forms", icon: FileText },
        { href: `/dashboard/${currentOrgId}/activity`, label: "Activity", icon: Activity },
      ]
    : [];

  const bottomNav = [
    { href: `/search`, label: "Search", icon: Search },
    { href: `/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-sidebar transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Header with Org Switcher */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!sidebarCollapsed ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between px-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                    <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="truncate text-sm font-semibold">
                    {currentOrg?.name || "Select Workspace"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  onClick={() => router.push(`/dashboard/${org.id}`)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted">
                      <Building2 className="h-3 w-3" />
                    </div>
                    <span>{org.name}</span>
                  </div>
                  {org.id === currentOrgId && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Create workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-4 w-4 text-primary-foreground" />
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 shrink-0", sidebarCollapsed && "mx-auto")}
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 py-2">
        {/* Main Navigation */}
        <nav className="space-y-1">
          {mainNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Org Navigation */}
        {currentOrgId && orgNav.length > 0 && (
          <>
            <Separator className="my-3" />
            {!sidebarCollapsed && (
              <div className="px-3 py-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {currentOrg?.name || "Workspace"}
                </span>
              </div>
            )}
            <nav className="space-y-1">
              {orgNav.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </nav>

            {/* Recent Projects */}
            {!sidebarCollapsed && (
              <>
                <Separator className="my-3" />
                <div className="flex items-center justify-between px-3 py-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent Projects
                  </span>
                  <Link href={`/dashboard/${currentOrgId}/projects`}>
                    <Button variant="ghost" size="icon" className="h-5 w-5">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <nav className="space-y-1">
                  {/* These would be dynamically loaded */}
                  <Link
                    href={`/dashboard/${currentOrgId}/projects`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  >
                    <FolderKanban className="h-4 w-4" />
                    View all projects
                  </Link>
                </nav>
              </>
            )}
          </>
        )}
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t p-2">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                sidebarCollapsed && "justify-center px-2"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
