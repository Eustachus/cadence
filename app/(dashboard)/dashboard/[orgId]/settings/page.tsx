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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  MoreVertical,
  Trash2,
  Shield,
  UserPlus,
  Mail,
  Clock,
  Loader2,
} from "lucide-react";
import {
  getMembers,
  getPendingInvites,
  inviteMember,
  removeMember,
  updateMemberRole,
  cancelInvite,
} from "@/actions/members";
import { getOrganization, updateOrganization, deleteOrganization } from "@/actions/organizations";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface Member {
  id: string;
  role: string;
  invitedEmail: string | null;
  inviteToken: string | null;
  inviteExpires: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface OrgData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  plan: string;
  _count: {
    memberships: number;
    teams: number;
    projects: number;
  };
}

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const [org, setOrg] = useState<OrgData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("MEMBER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Org settings form
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [orgBillingEmail, setOrgBillingEmail] = useState("");

  useEffect(() => {
    loadData();
  }, [orgId]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [orgData, membersData, invitesData] = await Promise.all([
        getOrganization(orgId),
        getMembers(orgId),
        getPendingInvites(orgId),
      ]);
      setOrg(orgData as OrgData);
      setMembers(membersData as Member[]);
      setPendingInvites(invitesData as Member[]);
      if (orgData) {
        setOrgName(orgData.name);
        setOrgDescription(orgData.description || "");
        setOrgBillingEmail("");
      }
    } catch {
      toast.error("Failed to load data");
    }
    setIsLoading(false);
  }

  async function handleInvite() {
    setIsSubmitting(true);
    try {
      const result = await inviteMember(orgId, {
        email: inviteEmail,
        role: inviteRole as "ADMIN" | "MEMBER" | "VIEWER",
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Invitation sent!");
        setIsInviteOpen(false);
        setInviteEmail("");
        loadData();
      }
    } catch {
      toast.error("Failed to send invite");
    }
    setIsSubmitting(false);
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm("Remove this member?")) return;
    try {
      const result = await removeMember(orgId, memberId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member removed");
        loadData();
      }
    } catch {
      toast.error("Failed to remove member");
    }
  }

  async function handleUpdateRole(memberId: string, role: string) {
    try {
      const result = await updateMemberRole(
        orgId,
        memberId,
        role as "ADMIN" | "MEMBER" | "VIEWER"
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Role updated");
        loadData();
      }
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      await cancelInvite(orgId, inviteId);
      toast.success("Invitation cancelled");
      loadData();
    } catch {
      toast.error("Failed to cancel invite");
    }
  }

  async function handleSaveOrg() {
    setIsSubmitting(true);
    try {
      const result = await updateOrganization(orgId, {
        name: orgName,
        description: orgDescription || null,
        billingEmail: orgBillingEmail || null,
      });
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Settings saved!");
        loadData();
      }
    } catch {
      toast.error("Failed to save settings");
    }
    setIsSubmitting(false);
  }

  async function handleDeleteOrg() {
    if (!confirm("Are you sure? This will permanently delete the organization and all data.")) return;
    try {
      await deleteOrganization(orgId);
      toast.success("Organization deleted");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to delete organization");
    }
  }

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "OWNER":
        return "default";
      case "ADMIN":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization settings and members.
        </p>
      </div>

      {/* Organization Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Update your organization details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input id="org-slug" value={org?.slug || ""} disabled />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              placeholder="Describe your organization"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing-email">Billing Email</Label>
            <Input
              id="billing-email"
              type="email"
              value={orgBillingEmail}
              onChange={(e) => setOrgBillingEmail(e.target.value)}
              placeholder="billing@example.com"
            />
          </div>
          <Button onClick={handleSaveOrg} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {org?._count.memberships || 0} members in this organization
              </CardDescription>
            </div>
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="name@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={inviteRole} onValueChange={setInviteRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="VIEWER">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleInvite}
                    disabled={isSubmitting || !inviteEmail}
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Send invitation
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.user.image ?? ""} />
                    <AvatarFallback>
                      {member.user.name
                        ? getInitials(member.user.name)
                        : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.user.name || member.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={roleBadgeVariant(member.role)}>
                    {member.role}
                  </Badge>
                  {member.role !== "OWNER" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member.id, "ADMIN")}
                        >
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member.id, "MEMBER")}
                        >
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateRole(member.id, "VIEWER")}
                        >
                          Make Viewer
                        </DropdownMenuItem>
                        <Separator className="my-1" />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pending Invites */}
          {pendingInvites.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Pending Invites</span>
              </div>
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border border-dashed p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {invite.invitedEmail}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Invited • Expires{" "}
                          {invite.inviteExpires
                            ? new Date(invite.inviteExpires).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{invite.role}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible and destructive actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteOrg}>
            Delete organization
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
