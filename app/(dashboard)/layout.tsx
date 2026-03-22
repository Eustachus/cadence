import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarWrapper } from "@/components/layout/sidebar-wrapper";
import { TopBar } from "@/components/layout/top-bar";
import { getOrganizations } from "@/actions/organizations";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  const organizations = await getOrganizations();

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarWrapper organizations={organizations} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={session.user} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto max-w-7xl p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
