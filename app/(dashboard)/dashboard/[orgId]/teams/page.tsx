"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreVertical, Edit, Trash2, Users, FolderKanban } from "lucide-react";
import { createTeam, getTeams, deleteTeam, updateTeam } from "@/actions/teams";
import { getInitials, generateColor } from "@/lib/utils";
import { toast } from "sonner";

interface TeamWithMembers {
  id: string;
  name: string;
  description: string | null;
  color: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    role: string;
    member: {
      id: string;
      user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
      };
    };
  }>;
  _count: {
    projects: number;
  };
}

export default function TeamsPage() {
  const params = useParams();
  const orgId = params.orgId as string;
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithMembers | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadTeams();
  }, [orgId]);

  async function loadTeams() {
    setIsLoading(true);
    try {
      const data = await getTeams(orgId);
      setTeams(data as TeamWithMembers[]);
    } catch {
      toast.error("Failed to load teams");
    }
    setIsLoading(false);
  }

  async function handleCreate() {
    setIsSubmitting(true);
    try {
      const result = await createTeam(orgId, {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Team created!");
        setIsCreateOpen(false);
        setFormData({ name: "", description: "", color: "#6366f1" });
        loadTeams();
      }
    } catch {
      toast.error("Failed to create team");
    }
    setIsSubmitting(false);
  }

  async function handleUpdate() {
    if (!editingTeam) return;
    setIsSubmitting(true);
    try {
      const result = await updateTeam(orgId, editingTeam.id, {
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Team updated!");
        setEditingTeam(null);
        setFormData({ name: "", description: "", color: "#6366f1" });
        loadTeams();
      }
    } catch {
      toast.error("Failed to update team");
    }
    setIsSubmitting(false);
  }

  async function handleDelete(teamId: string) {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      const result = await deleteTeam(orgId, teamId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Team deleted");
        loadTeams();
      }
    } catch {
      toast.error("Failed to delete team");
    }
  }

  function openEditDialog(team: TeamWithMembers) {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      color: team.color,
    });
  }

  const TeamForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team-name">Name</Label>
        <Input
          id="team-name"
          placeholder="Team name"
          value={formData.name}
          onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="team-description">Description</Label>
        <Textarea
          id="team-description"
          placeholder="What does this team do?"
          value={formData.description}
          onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
        />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2">
          {["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7", "#ec4899"].map((c) => (
            <button
              key={c}
              type="button"
              className={`h-8 w-8 rounded-full border-2 transition-all ${
                formData.color === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              onClick={() => setFormData((f) => ({ ...f, color: c }))}
            />
          ))}
        </div>
      </div>
      <Button onClick={onSubmit} disabled={isSubmitting || !formData.name}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams within your organization.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a team</DialogTitle>
              <DialogDescription>
                Teams help you organize projects and people.
              </DialogDescription>
            </DialogHeader>
            <TeamForm onSubmit={handleCreate} submitLabel="Create team" />
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit team</DialogTitle>
            <DialogDescription>
              Update the team details.
            </DialogDescription>
          </DialogHeader>
          <TeamForm onSubmit={handleUpdate} submitLabel="Save changes" />
        </DialogContent>
      </Dialog>

      {/* Teams Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No teams yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Create your first team to get started.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: team.color + "20" }}
                    >
                      <Users className="h-5 w-5" style={{ color: team.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      {team.description && (
                        <CardDescription className="mt-0.5">
                          {team.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(team)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(team.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 5).map((tm) => (
                      <Avatar key={tm.id} className="h-7 w-7 border-2 border-background">
                        <AvatarImage src={tm.member.user.image ?? ""} />
                        <AvatarFallback className="text-xs">
                          {tm.member.user.name
                            ? getInitials(tm.member.user.name)
                            : "?"}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {team.members.length > 5 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                        +{team.members.length - 5}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <FolderKanban className="h-3 w-3" />
                      {team._count.projects}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {team.members.length}
                    </Badge>
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
