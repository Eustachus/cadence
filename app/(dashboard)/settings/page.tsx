import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Bell,
  Palette,
  Shield,
  CreditCard,
  Plug,
  ChevronRight,
} from "lucide-react";

const settingsLinks = [
  {
    href: "/settings/profile",
    title: "Profile",
    description: "Manage your personal information and avatar",
    icon: User,
  },
  {
    href: "/settings/notifications",
    title: "Notifications",
    description: "Configure email, push, and in-app notifications",
    icon: Bell,
  },
  {
    href: "/settings/appearance",
    title: "Appearance",
    description: "Customize theme, density, and accent color",
    icon: Palette,
  },
  {
    href: "/settings/security",
    title: "Security",
    description: "Password, two-factor authentication, sessions",
    icon: Shield,
  },
  {
    href: "/settings/billing",
    title: "Billing",
    description: "Manage subscription and payment methods",
    icon: CreditCard,
  },
  {
    href: "/settings/integrations",
    title: "Integrations",
    description: "Connect with external services",
    icon: Plug,
  },
];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <link.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{link.title}</CardTitle>
                      <CardDescription className="mt-0.5 text-xs">
                        {link.description}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{session.user.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session.user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
