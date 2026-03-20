"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  FileText,
  ExternalLink,
  Copy,
  Trash2,
  Settings,
  Loader2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";

interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  fields: FormField[];
  settings: { theme?: string; redirectUrl?: string } | null;
  projectId: string;
  createdAt: Date;
  project: { name: string; color: string };
  _count: { submissions: number };
}

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "priority", label: "Priority" },
];

export default function FormsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form builder state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFields, setFormFields] = useState<FormField[]>([
    { id: "1", type: "text", label: "Title", required: true },
    { id: "2", type: "textarea", label: "Description", required: false },
  ]);

  useEffect(() => {
    loadForms();
  }, [orgId]);

  async function loadForms() {
    setIsLoading(true);
    try {
      // TODO: Implement getForms action
      setForms([]);
    } catch {
      toast.error("Failed to load forms");
    }
    setIsLoading(false);
  }

  function addField(type: string) {
    const newField: FormField = {
      id: Date.now().toString(),
      type,
      label: "",
      required: false,
      options: type === "select" ? ["Option 1", "Option 2"] : undefined,
    };
    setFormFields((prev) => [...prev, newField]);
  }

  function removeField(id: string) {
    setFormFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateField(id: string, updates: Partial<FormField>) {
    setFormFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }

  async function handleCreate() {
    if (!formTitle.trim()) {
      toast.error("Form title is required");
      return;
    }
    setIsSubmitting(true);
    try {
      // TODO: Implement createForm action
      toast.success("Form created!");
      setIsCreateOpen(false);
      setFormTitle("");
      setFormDescription("");
      setFormFields([
        { id: "1", type: "text", label: "Title", required: true },
        { id: "2", type: "textarea", label: "Description", required: false },
      ]);
      loadForms();
    } catch {
      toast.error("Failed to create form");
    }
    setIsSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="text-muted-foreground">
            Create public forms that generate tasks automatically.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create a form</DialogTitle>
              <DialogDescription>
                Build a form that creates tasks in your project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Form Title</Label>
                <Input
                  placeholder="e.g., Bug Report, Feature Request"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe what this form is for..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              {/* Fields */}
              <div className="space-y-3">
                <Label>Fields</Label>
                {formFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-start gap-2 rounded-lg border p-3"
                  >
                    <GripVertical className="mt-2 h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Field label"
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, { label: e.target.value })
                          }
                          className="flex-1"
                        />
                        <Select
                          value={field.type}
                          onValueChange={(v) =>
                            updateField(field.id, { type: v })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FIELD_TYPES.map((ft) => (
                              <SelectItem key={ft.value} value={ft.value}>
                                {ft.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(v) =>
                              updateField(field.id, { required: v })
                            }
                          />
                          Required
                        </label>
                        {index > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => removeField(field.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Select onValueChange={addField}>
                  <SelectTrigger>
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add field...</span>
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((ft) => (
                      <SelectItem key={ft.value} value={ft.value}>
                        {ft.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !formTitle.trim()}
                className="w-full"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create form
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No forms yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create a form to collect submissions that become tasks.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((form) => (
            <Card key={form.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    {form.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {form.description}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      {form.fields?.length || 0} fields
                    </Badge>
                    <Badge variant="outline">
                      {form._count?.submissions || 0} submissions
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
