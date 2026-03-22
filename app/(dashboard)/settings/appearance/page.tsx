"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sun, Moon, Monitor, Palette, Layout, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: "light", label: "Light", icon: Sun, description: "Light mode" },
    { id: "dark", label: "Dark", icon: Moon, description: "Dark mode" },
    { id: "system", label: "System", icon: Monitor, description: "Follow system" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Appearance</h1>
        <p className="text-muted-foreground">
          Customize how Cadence looks and feels.
        </p>
      </div>

      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color scheme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors",
                  theme === t.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted hover:border-border"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  theme === t.id ? "bg-primary text-primary-foreground" : "bg-background"
                )}>
                  <t.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Density */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Density
          </CardTitle>
          <CardDescription>
            Adjust the spacing and density of the interface.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue="comfortable">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compact">Compact</SelectItem>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="spacious">Spacious</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Font */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Font Size
          </CardTitle>
          <CardDescription>
            Adjust the base font size.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue="medium">
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>
            Choose your preferred accent color.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[
              { color: "#2563eb", name: "Blue" },
              { color: "#6366f1", name: "Indigo" },
              { color: "#8b5cf6", name: "Purple" },
              { color: "#ec4899", name: "Pink" },
              { color: "#ef4444", name: "Red" },
              { color: "#f97316", name: "Orange" },
              { color: "#eab308", name: "Yellow" },
              { color: "#22c55e", name: "Green" },
              { color: "#14b8a6", name: "Teal" },
              { color: "#06b6d4", name: "Cyan" },
            ].map((c) => (
              <button
                key={c.color}
                className="flex flex-col items-center gap-1"
                title={c.name}
              >
                <div
                  className="h-8 w-8 rounded-full border-2 border-transparent transition-all hover:scale-110 hover:border-foreground"
                  style={{ backgroundColor: c.color }}
                />
                <span className="text-xs text-muted-foreground">{c.name}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
