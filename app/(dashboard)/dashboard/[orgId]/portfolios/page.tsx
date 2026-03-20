"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  FolderKanban,
  Briefcase,
  Loader2,
} from "lucide-react";
import {
  getPortfolios,
  createPortfolio,
  deletePortfolio,
} from "@/actions/portfolios";
import { PROJECT_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PortfolioProject {
  project: {
    id: string;
    name: string;
    color: string;
    status: string;
    _count: { tasks: number };
    team: { name: string; color: string } | null;
  };
}

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  projects: PortfolioProject[];
  _count: { projects: number };
}

export default function PortfoliosPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPortfolios();
  }, [orgId]);

  async function loadPortfolios() {
    setIsLoading(true);
    try {
      const data = await getPortfolios(orgId);
      setPortfolios(data as any);
    } catch {
      toast.error("Failed to load portfolios");
    }
    setIsLoading(false);
  }

  async function handleCreate() {
    setIsSubmitting(true);
    try {
      const result = await createPortfolio(orgId, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Portfolio created!");
        setFormData({ name: "", description: "", color: "#6366f1" });
        setIsCreateOpen(false);
        loadPortfolios();
      }
    } catch {
      toast.error("Failed to create portfolio");
    }
    setIsSubmitting(false);
  }

  async function handleDelete(portfolioId: string) {
    if (!confirm("Delete this portfolio?")) return;
    try {
      await deletePortfolio(orgId, portfolioId);
      toast.success("Portfolio deleted");
      loadPortfolios();
    } catch {
      toast.error("Failed to delete portfolio");
    }
  }

  function getPortfolioStatus(portfolio: Portfolio) {
    if (portfolio.projects.length === 0) return { label: "Empty", color: "#94a3b8" };
    const statuses = portfolio.projects.map(
      (pp) =>
        PROJECT_STATUSES.find((s) => s.value === pp.project.status) ||
        PROJECT_STATUSES[0]
    );
    if (statuses.every((s) => s.value === "COMPLETE"))
      return { label: "Complete", color: "#22c55e" };
    if (statuses.some((s) => s.value === "OFF_TRACK"))
      return { label: "At Risk", color: "#ef4444" };
    if (statuses.some((s) => s.value === "AT_RISK"))
      return { label: "Attention", color: "#f59e0b" };
    return { label: "On Track", color: "#22c55e" };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
          <p className="text-muted-foreground">
            Group and monitor related projects.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Portfolio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a portfolio</DialogTitle>
              <DialogDescription>
                Group related projects together.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="Portfolio name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the portfolio..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        className={`h-7 w-7 rounded-full border-2 ${
                          formData.color === c
                            ? "border-foreground scale-110"
                            : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFormData((f) => ({ ...f, color: c }))}
                      />
                    )
                  )}
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !formData.name}
                className="w-full"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create portfolio
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
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No portfolios yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create a portfolio to group related projects.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {portfolios.map((portfolio) => {
            const status = getPortfolioStatus(portfolio);
            const totalTasks = portfolio.projects.reduce(
              (sum, pp) => sum + (pp.project._count?.tasks || 0),
              0
            );

            return (
              <Card key={portfolio.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ backgroundColor: portfolio.color + "20" }}
                      >
                        <Briefcase
                          className="h-5 w-5"
                          style={{ color: portfolio.color }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {portfolio.name}
                        </CardTitle>
                        {portfolio.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {portfolio.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: status.color,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDelete(portfolio.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" />
                      {portfolio._count.projects} projects
                    </span>
                    <span>{totalTasks} tasks total</span>
                  </div>

                  {/* Project List */}
                  {portfolio.projects.length > 0 && (
                    <div className="space-y-2">
                      {portfolio.projects.slice(0, 4).map((pp) => {
                        const projectStatus = PROJECT_STATUSES.find(
                          (s) => s.value === pp.project.status
                        );
                        return (
                          <div
                            key={pp.project.id}
                            className="flex items-center justify-between rounded-md border p-2"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: pp.project.color }}
                              />
                              <Link
                                href={`/dashboard/${orgId}/projects/${pp.project.id}`}
                                className="text-sm font-medium hover:underline"
                              >
                                {pp.project.name}
                              </Link>
                            </div>
                            <div className="flex items-center gap-2">
                              {pp.project.team && (
                                <Badge variant="secondary" className="text-[10px]">
                                  {pp.project.team.name}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                style={{
                                  borderColor: projectStatus?.color,
                                  color: projectStatus?.color,
                                }}
                                className="text-[10px]"
                              >
                                {projectStatus?.label}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                      {portfolio.projects.length > 4 && (
                        <p className="text-xs text-muted-foreground">
                          +{portfolio.projects.length - 4} more projects
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
