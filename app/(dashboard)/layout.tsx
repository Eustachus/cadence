import { SidebarWrapper } from "@/components/layout/sidebar-wrapper";
import { TopBar } from "@/components/layout/top-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarWrapper organizations={[]} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar user={{ id: "", name: "User", email: "", image: null }} />
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container mx-auto max-w-7xl p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
