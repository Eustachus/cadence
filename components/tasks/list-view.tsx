"use client";

import { useState, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  SortingState,
  ColumnFiltersState,
  GroupingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Columns3,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Minus,
} from "lucide-react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/constants";
import { formatDate, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  position: number;
  dueDate: Date | null;
  startDate: Date | null;
  sectionId: string | null;
  section: { id: string; name: string } | null;
  assignments: Array<{
    id: string;
    member: {
      id: string;
      user: { id: string; name: string | null; image: string | null };
    };
  }>;
  labels: Array<{
    label: { id: string; name: string; color: string };
  }>;
  _count: { comments: number; subTasks: number; attachments: number };
}

interface ListViewProps {
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onStatusChange: (taskId: string, status: string) => void;
}

const priorityOrder: Record<string, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  NONE: 4,
};

export function ListView({ tasks, onTaskClick, onStatusChange }: ListViewProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [groupBy, setGroupBy] = useState<string>("none");

  const columns: ColumnDef<Task>[] = useMemo(
    () => [
      {
        id: "status",
        accessorKey: "status",
        header: "",
        size: 40,
        cell: ({ row }) => {
          const task = row.original;
          const isDone = task.status === "DONE";
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(task.id, isDone ? "TODO" : "DONE");
              }}
              className="shrink-0"
            >
              {isDone ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </button>
          );
        },
        enableSorting: false,
      },
      {
        id: "title",
        accessorKey: "title",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const task = row.original;
          const isDone = task.status === "DONE";
          return (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-medium",
                  isDone && "line-through text-muted-foreground"
                )}
              >
                {task.title}
              </span>
              {task.labels.length > 0 &&
                task.labels.map((l) => (
                  <span
                    key={l.label.id}
                    className="inline-block h-2 w-6 rounded-full"
                    style={{ backgroundColor: l.label.color }}
                    title={l.label.name}
                  />
                ))}
            </div>
          );
        },
      },
      {
        id: "status-filter",
        accessorKey: "status",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const status = TASK_STATUSES.find(
            (s) => s.value === row.original.status
          );
          return status ? (
            <Badge
              variant="outline"
              style={{ borderColor: status.color, color: status.color }}
            >
              <div
                className="mr-1 h-2 w-2 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              {status.label}
            </Badge>
          ) : null;
        },
      },
      {
        id: "priority",
        accessorKey: "priority",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Priority
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const p = TASK_PRIORITIES.find(
            (pr) => pr.value === row.original.priority
          );
          return p ? (
            <span className="flex items-center gap-1 text-sm">
              <span>{p.icon}</span>
              {p.label}
            </span>
          ) : null;
        },
        sortingFn: (rowA, rowB) => {
          return (
            (priorityOrder[rowA.original.priority] ?? 4) -
            (priorityOrder[rowB.original.priority] ?? 4)
          );
        },
      },
      {
        id: "assignee",
        accessorFn: (row) =>
          row.assignments?.[0]?.member?.user?.name || "Unassigned",
        header: "Assignee",
        cell: ({ row }) => {
          const assignments = row.original.assignments;
          if (!assignments?.length)
            return (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            );
          return (
            <div className="flex -space-x-1.5">
              {assignments.slice(0, 2).map((a) => (
                <Avatar key={a.id} className="h-6 w-6 border border-background">
                  <AvatarImage src={a.member.user.image ?? ""} />
                  <AvatarFallback className="text-[9px]">
                    {a.member.user.name
                      ? getInitials(a.member.user.name)
                      : "?"}
                  </AvatarFallback>
                </Avatar>
              ))}
              {assignments.length > 2 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-muted text-[9px]">
                  +{assignments.length - 2}
                </div>
              )}
            </div>
          );
        },
      },
      {
        id: "dueDate",
        accessorKey: "dueDate",
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-7"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-1 h-3 w-3" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-1 h-3 w-3" />
            ) : (
              <ArrowUpDown className="ml-1 h-3 w-3" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const dueDate = row.original.dueDate;
          const isOverdue =
            dueDate && new Date(dueDate) < new Date() && row.original.status !== "DONE";
          return dueDate ? (
            <span
              className={cn(
                "flex items-center gap-1 text-sm",
                isOverdue && "text-destructive font-medium"
              )}
            >
              <Clock className="h-3 w-3" />
              {formatDate(dueDate)}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          );
        },
      },
      {
        id: "section",
        accessorFn: (row) => row.section?.name || "No section",
        header: "Section",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.section?.name || "No section"}
          </span>
        ),
      },
    ],
    [onStatusChange]
  );

  const grouping = useMemo<GroupingState>(
    () => (groupBy !== "none" ? [groupBy] : []),
    [groupBy]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      grouping,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter tasks..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-8 pl-8"
          />
        </div>
        <Select value={groupBy} onValueChange={setGroupBy}>
          <SelectTrigger className="h-8 w-36">
            <Columns3 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Group by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="status-filter">By Status</SelectItem>
            <SelectItem value="priority">By Priority</SelectItem>
            <SelectItem value="assignee">By Assignee</SelectItem>
            <SelectItem value="section">By Section</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} style={{ width: header.getSize() }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No tasks found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onTaskClick(row.original.id)}
                  className="cursor-pointer"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {row.getIsGrouped() && cell.column.getIsGrouped() ? (
                        <button
                          onClick={row.getToggleExpandedHandler()}
                          className="flex items-center gap-2"
                        >
                          {row.getIsExpanded() ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}{" "}
                          ({row.subRows.length})
                        </button>
                      ) : row.getIsGrouped() ? null : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
