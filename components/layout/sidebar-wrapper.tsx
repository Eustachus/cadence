"use client";

import { usePathname } from "next/navigation";
import { Sidebar as SidebarComponent } from "@/components/layout/sidebar";

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface SidebarWrapperProps {
  organizations: Organization[];
}

export function SidebarWrapper({ organizations }: SidebarWrapperProps) {
  const pathname = usePathname();

  // Extract orgId from pathname
  // Pattern: /dashboard/[orgId]/...
  const match = pathname.match(/\/dashboard\/([^/]+)/);
  const currentOrgId =
    match && match[1] !== "new" && !match[1].startsWith("[")
      ? match[1]
      : undefined;

  return (
    <SidebarComponent
      organizations={organizations}
      currentOrgId={currentOrgId}
    />
  );
}
