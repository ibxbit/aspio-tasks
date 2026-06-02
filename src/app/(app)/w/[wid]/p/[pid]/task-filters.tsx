"use client";

import * as React from "react";
import { ChevronDown, Check, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Member, TaskStatus } from "./project-view";

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

type Props = {
  statuses: Set<TaskStatus>;
  assigneeId: string | null;
  members: Member[];
  totalCount: number;
  filteredCount: number;
  onChangeStatuses: (next: Set<TaskStatus>) => void;
  onChangeAssignee: (next: string | null) => void;
};

export function TaskFilters({
  statuses,
  assigneeId,
  members,
  totalCount,
  filteredCount,
  onChangeStatuses,
  onChangeAssignee,
}: Props): React.ReactElement {
  const toggleStatus = (s: TaskStatus): void => {
    const next = new Set(statuses);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    onChangeStatuses(next);
  };

  const assignee =
    assigneeId === "unassigned"
      ? { kind: "unassigned" as const }
      : assigneeId
        ? {
            kind: "user" as const,
            member: members.find((m) => m.id === assigneeId) ?? null,
          }
        : { kind: "any" as const };

  const assigneeLabel =
    assignee.kind === "unassigned"
      ? "Unassigned"
      : assignee.kind === "user"
        ? (assignee.member?.displayName ?? "Unknown user")
        : "Anyone";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex flex-wrap items-center gap-1">
        {STATUSES.map((s) => {
          const active = statuses.has(s.value);
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => toggleStatus(s.value)}
              aria-pressed={active}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors focus-ring",
                active
                  ? "border-primary/30 bg-accent text-accent-foreground"
                  : "border-border bg-surface text-muted-foreground hover:bg-muted",
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <span className="text-muted-foreground" aria-hidden>
        ·
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted focus-ring"
          aria-label="Filter by assignee"
        >
          <UserRound className="h-3.5 w-3.5" />
          <span className="text-foreground">{assigneeLabel}</span>
          <ChevronDown className="h-3 w-3" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[14rem]">
          <DropdownMenuLabel>Assignee</DropdownMenuLabel>
          <AssigneeOption
            label="Anyone"
            active={assignee.kind === "any"}
            onSelect={() => onChangeAssignee(null)}
          />
          <AssigneeOption
            label="Unassigned"
            active={assignee.kind === "unassigned"}
            onSelect={() => onChangeAssignee("unassigned")}
          />
          {members.length > 0 ? <DropdownMenuSeparator /> : null}
          {members.map((m) => (
            <AssigneeOption
              key={m.id}
              label={m.displayName}
              active={assignee.kind === "user" && assignee.member?.id === m.id}
              onSelect={() => onChangeAssignee(m.id)}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
        {filteredCount === totalCount
          ? `${totalCount} ${totalCount === 1 ? "task" : "tasks"}`
          : `${filteredCount} of ${totalCount}`}
      </span>
    </div>
  );
}

function AssigneeOption({
  label,
  active,
  onSelect,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
}): React.ReactElement {
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      className="flex items-center justify-between gap-2"
    >
      <span>{label}</span>
      {active ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
    </DropdownMenuItem>
  );
}
