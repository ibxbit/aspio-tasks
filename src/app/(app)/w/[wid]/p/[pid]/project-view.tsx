"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { TaskFilters } from "./task-filters";
import { TaskRow } from "./task-row";
import { TaskDetailSheet } from "./task-detail-sheet";
import { CreateTaskInline } from "./create-task-inline";

export type TaskStatus = "todo" | "in_progress" | "done";

export type Member = {
  id: string;
  displayName: string;
  role: "owner" | "member";
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
};

const ALL_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];

type Props = {
  projectId: string;
  workspaceId: string;
  tasks: Task[];
  members: Member[];
};

export function ProjectView({
  projectId,
  workspaceId,
  tasks,
  members,
}: Props): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null);

  const statusFilter = React.useMemo<Set<TaskStatus>>(() => {
    const raw = searchParams.get("status");
    if (!raw) return new Set();
    const picked = raw.split(",").filter((s): s is TaskStatus =>
      ALL_STATUSES.includes(s as TaskStatus),
    );
    return new Set(picked);
  }, [searchParams]);

  const assigneeFilter = searchParams.get("assignee");

  const filtered = React.useMemo(() => {
    return tasks.filter((t) => {
      if (statusFilter.size > 0 && !statusFilter.has(t.status)) return false;
      if (assigneeFilter === "unassigned") {
        if (t.assigneeId !== null) return false;
      } else if (assigneeFilter) {
        if (t.assigneeId !== assigneeFilter) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, assigneeFilter]);

  const updateUrl = React.useCallback(
    (next: { status?: Set<TaskStatus>; assignee?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.status !== undefined) {
        if (next.status.size === 0) params.delete("status");
        else params.set("status", Array.from(next.status).join(","));
      }
      if (next.assignee !== undefined) {
        if (next.assignee === null) params.delete("assignee");
        else params.set("assignee", next.assignee);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
    },
    [router, searchParams],
  );

  const openTask = filtered.find((t) => t.id === openTaskId) ?? null;

  const onMutateError = React.useCallback((msg: string) => {
    toast.error(msg);
  }, []);

  return (
    <>
      <div className="space-y-5">
        <TaskFilters
          statuses={statusFilter}
          assigneeId={assigneeFilter}
          members={members}
          totalCount={tasks.length}
          filteredCount={filtered.length}
          onChangeStatuses={(s) => updateUrl({ status: s })}
          onChangeAssignee={(id) => updateUrl({ assignee: id })}
        />

        <CreateTaskInline
          projectId={projectId}
          workspaceId={workspaceId}
          onError={onMutateError}
        />

        {tasks.length === 0 ? (
          <EmptyTasks />
        ) : filtered.length === 0 ? (
          <NoMatches onClear={() => updateUrl({ status: new Set(), assignee: null })} />
        ) : (
          <ul className="overflow-hidden rounded-lg border border-border bg-surface divide-y divide-border">
            {filtered.map((t) => (
              <li key={t.id}>
                <TaskRow
                  task={t}
                  workspaceId={workspaceId}
                  members={members}
                  onOpen={() => setOpenTaskId(t.id)}
                  onError={onMutateError}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <TaskDetailSheet
        task={openTask}
        members={members}
        workspaceId={workspaceId}
        projectId={projectId}
        open={openTaskId !== null && openTask !== null}
        onOpenChange={(open) => {
          if (!open) setOpenTaskId(null);
        }}
        onError={onMutateError}
      />
    </>
  );
}

function EmptyTasks(): React.ReactElement {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
      <p className="text-sm font-medium">No tasks yet.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Add your first one above. Press <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] font-mono">Enter</kbd> to save.
      </p>
    </div>
  );
}

function NoMatches({ onClear }: { onClear: () => void }): React.ReactElement {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
      <p className="text-sm font-medium">No tasks match your filters.</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 text-sm font-medium text-primary hover:underline focus-ring rounded"
      >
        Clear filters
      </button>
    </div>
  );
}
