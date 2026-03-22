"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Mail, Monitor, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NotificationsSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    emailEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
    taskAssigned: true,
    taskCompleted: true,
    taskComment: true,
    taskMention: true,
    taskDueSoon: true,
    goalUpdate: true,
    memberInvited: true,
    digestFrequency: "daily",
  });

  async function handleSave() {
    setIsLoading(true);
    try {
      // Simulate save
      await new Promise((r) => setTimeout(r, 1000));
      toast.success("Notification settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
    setIsLoading(false);
  }

  function toggleSetting(key: keyof typeof settings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground">
          Configure how and when you receive notifications.
        </p>
      </div>

      {/* Channel Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <Label className="text-base">In-app notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show notifications within the application
                </p>
              </div>
            </div>
            <Switch
              checked={settings.inAppEnabled}
              onCheckedChange={() => toggleSetting("inAppEnabled")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <Label className="text-base">Push notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser push notifications
                </p>
              </div>
            </div>
            <Switch
              checked={settings.pushEnabled}
              onCheckedChange={() => toggleSetting("pushEnabled")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <Label className="text-base">Email notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive notifications via email
                </p>
              </div>
            </div>
            <Switch
              checked={settings.emailEnabled}
              onCheckedChange={() => toggleSetting("emailEnabled")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Events</CardTitle>
          <CardDescription>
            Choose which events trigger notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "taskAssigned", label: "When a task is assigned to me" },
            { key: "taskCompleted", label: "When a task I created is completed" },
            { key: "taskComment", label: "When someone comments on my task" },
            { key: "taskMention", label: "When someone mentions me" },
            { key: "taskDueSoon", label: "When a task due date is approaching" },
            { key: "goalUpdate", label: "When a goal I follow is updated" },
            { key: "memberInvited", label: "When someone is invited to the team" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <Label className="font-normal">{item.label}</Label>
              <Switch
                checked={settings[item.key as keyof typeof settings] as boolean}
                onCheckedChange={() => toggleSetting(item.key as keyof typeof settings)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Digest Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Email Digest
          </CardTitle>
          <CardDescription>
            Choose how often to receive email digests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={settings.digestFrequency}
            onValueChange={(v) => setSettings((prev) => ({ ...prev, digestFrequency: v }))}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="immediate">Immediate</SelectItem>
              <SelectItem value="daily">Daily digest</SelectItem>
              <SelectItem value="weekly">Weekly digest</SelectItem>
              <SelectItem value="never">Never</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save preferences
      </Button>
    </div>
  );
}
