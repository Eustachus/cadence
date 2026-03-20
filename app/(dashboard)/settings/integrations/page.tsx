"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Github,
  Slack,
  Calendar,
  HardDrive,
  Figma,
  Globe,
  MessageSquare,
  Check,
  ExternalLink,
} from "lucide-react";

const integrations = [
  {
    name: "GitHub",
    description: "Link commits, PRs, and issues to tasks automatically.",
    icon: Github,
    connected: false,
    category: "Development",
  },
  {
    name: "Slack",
    description: "Get notifications and create tasks from Slack.",
    icon: MessageSquare,
    connected: false,
    category: "Communication",
  },
  {
    name: "Google Calendar",
    description: "Sync tasks with due dates to your calendar.",
    icon: Calendar,
    connected: false,
    category: "Calendar",
  },
  {
    name: "Google Drive",
    description: "Attach files from Google Drive to tasks.",
    icon: HardDrive,
    connected: false,
    category: "Storage",
  },
  {
    name: "Figma",
    description: "Preview Figma designs directly in task cards.",
    icon: Figma,
    connected: false,
    category: "Design",
  },
  {
    name: "Zapier",
    description: "Connect Cadence with 5000+ apps via Zapier.",
    icon: Globe,
    connected: false,
    category: "Automation",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">
          Connect Cadence with your favorite tools.
        </p>
      </div>

      {/* Webhook */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Webhooks</CardTitle>
              <CardDescription>
                Receive real-time event notifications via webhooks.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Set up webhooks to receive POST requests when tasks are created,
            updated, completed, or deleted.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.name} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <integration.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <Badge variant="secondary" className="mt-0.5 text-[10px]">
                      {integration.category}
                    </Badge>
                  </div>
                </div>
                <Switch checked={integration.connected} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>
              <Button
                variant={integration.connected ? "outline" : "default"}
                size="sm"
                className="mt-3 w-full"
              >
                {integration.connected ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Connected
                  </>
                ) : (
                  "Connect"
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>API Access</CardTitle>
          <CardDescription>
            Generate API keys for programmatic access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use the Cadence API to build custom integrations, automate
            workflows, and connect with your existing tools.
          </p>
          <div className="flex gap-2">
            <Button variant="outline">View API Docs</Button>
            <Button>Generate API Key</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
