"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search as SearchIcon,
  CheckCircle2,
  FolderKanban,
  FileText,
  Target,
  Clock,
} from "lucide-react";
import { globalSearch } from "@/actions/search";
import { TASK_STATUSES } from "@/lib/constants";
import { formatRelativeTime, debounce } from "@/lib/utils";

export default function SearchPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = (params as any).orgId || "";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    tasks: any[];
    projects: any[];
    pages: any[];
    goals: any[];
  }>({ tasks: [], projects: [], pages: [], goals: [] });
  const [isSearching, setIsSearching] = useState(false);

  const totalResults =
    results.tasks.length +
    results.projects.length +
    results.pages.length +
    results.goals.length;

  useEffect(() => {
    if (!query.trim() || !orgId) {
      setResults({ tasks: [], projects: [], pages: [], goals: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await globalSearch(orgId, query);
        setResults(data);
      } catch {
        // Handle silently
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, orgId]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Search across tasks, projects, pages, and goals.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for anything..."
          className="h-12 pl-10 text-base"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="space-y-4">
          {isSearching ? (
            <p className="text-center text-sm text-muted-foreground">
              Searching...
            </p>
          ) : totalResults === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <SearchIcon className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-semibold">No results found</h3>
                <p className="text-sm text-muted-foreground">
                  Try different keywords or check your spelling.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">
                  All ({totalResults})
                </TabsTrigger>
                {results.tasks.length > 0 && (
                  <TabsTrigger value="tasks">
                    Tasks ({results.tasks.length})
                  </TabsTrigger>
                )}
                {results.projects.length > 0 && (
                  <TabsTrigger value="projects">
                    Projects ({results.projects.length})
                  </TabsTrigger>
                )}
                {results.pages.length > 0 && (
                  <TabsTrigger value="pages">
                    Pages ({results.pages.length})
                  </TabsTrigger>
                )}
                {results.goals.length > 0 && (
                  <TabsTrigger value="goals">
                    Goals ({results.goals.length})
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-4">
                {/* Tasks */}
                {results.tasks.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Tasks
                    </h3>
                    <div className="space-y-1">
                      {results.tasks.map((task) => {
                        const status = TASK_STATUSES.find(
                          (s) => s.value === task.status
                        );
                        return (
                          <div
                            key={task.id}
                            onClick={() =>
                              router.push(
                                `/dashboard/${orgId}/projects/${task.projectId}`
                              )
                            }
                            className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                          >
                            <div
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: status?.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {task.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {task.project?.name}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {status?.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Projects */}
                {results.projects.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <FolderKanban className="h-4 w-4" />
                      Projects
                    </h3>
                    <div className="space-y-1">
                      {results.projects.map((project) => (
                        <div
                          key={project.id}
                          onClick={() =>
                            router.push(
                              `/dashboard/${orgId}/projects/${project.id}`
                            )
                          }
                          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <div
                            className="h-3 w-3 rounded shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{project.name}</p>
                            {project.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {project._count?.tasks || 0} tasks
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pages */}
                {results.pages.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Pages
                    </h3>
                    <div className="space-y-1">
                      {results.pages.map((page) => (
                        <div
                          key={page.id}
                          onClick={() =>
                            router.push(`/dashboard/${orgId}/pages/${page.id}`)
                          }
                          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <p className="text-sm font-medium">{page.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Goals */}
                {results.goals.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Goals
                    </h3>
                    <div className="space-y-1">
                      {results.goals.map((goal) => (
                        <div
                          key={goal.id}
                          onClick={() =>
                            router.push(`/dashboard/${orgId}/goals`)
                          }
                          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{goal.title}</p>
                            {goal.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {goal.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline">{goal.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}

      {/* Empty State */}
      {!query.trim() && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <SearchIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Start searching</h3>
            <p className="text-sm text-muted-foreground">
              Type to search across all your data. Use Cmd+K for quick access.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
