"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useRealtimeTasks } from "@/lib/realtime/use-realtime-tasks";
import { TaskFilters } from "./task-filters";
import { TaskRow } from "./task-row";
import { TaskDetailSheet } from "./task-detail-sheet";
import { CreateTaskInline } from "./create-task-inline";
import { createTask, deleteTask, updateTask } from "./actions";

export type TaskStatus = "todo" | "in_progress" | "done";

export type Member = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
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

export type TaskPatch = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  assignee_id?: string | null;
  due_date?: string | null;
};

export type TaskActions = {
  updateTask: (taskId: string, patch: TaskPatch) => Promise<void>;
  createTask: (title: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
};

const ALL_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];

function applyPatch(task: Task, patch: TaskPatch): Task {
  return {
    ...task,
    ...(patch.title !== undefined && { title: patch.title }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.status !== undefined && { status: patch.status }),
    ...(patch.assignee_id !== undefined && { assigneeId: patch.assignee_id }),
    ...(patch.due_date !== undefined && { dueDate: patch.due_date }),
  };
}

type Props = {
  projectId: string;
  workspaceId: string;
  tasks: Task[];
  members: Member[];
};

export function ProjectView({
  projectId,
  workspaceId,
  tasks: initialTasks,
  members,
}: Props): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null);

  // Lift tasks into state so realtime events can patch them in place.
  // We track the last initial array we saw so a server-side revalidation
  // (router.refresh) replaces our state cleanly.
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [lastSeenInitial, setLastSeenInitial] = React.useState(initialTasks);
  if (initialTasks !== lastSeenInitial) {
    setLastSeenInitial(initialTasks);
    setTasks(initialTasks);
  }

  // Ref mirrors current state so the memoised mutation helpers can read the
  // *latest* tasks without re-running their useMemo, and without relying on
  // setTasks side effects (which queue and don't execute synchronously).
  const tasksRef = React.useRef<Task[]>(tasks);
  React.useEffect(() => {
    tasksRef.current = tasks;
  });

  const handlers = React.useMemo(
    () => ({
      onInsert: (t: Task) => {
        setTasks((prev) =>
          prev.some((p) => p.id === t.id) ? prev : [t, ...prev],
        );
      },
      onUpdate: (t: Task) => {
        setTasks((prev) => prev.map((p) => (p.id === t.id ? t : p)));
      },
      onDelete: (id: string) => {
        setTasks((prev) => prev.filter((p) => p.id !== id));
      },
    }),
    [],
  );
  useRealtimeTasks(projectId, handlers);

  // Optimistic mutations: update local state immediately, then call the
  // server action. If the action returns an error OR throws (e.g. network
  // failure), restore the previous snapshot and surface a toast. The
  // realtime broadcast for our own successful change is idempotent because
  // the merge keys on task id.
  const actions = React.useMemo<TaskActions>(
    () => ({
      updateTask: async (taskId, patch) => {
        const snapshot = tasksRef.current.find((t) => t.id === taskId);
        if (!snapshot) return;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? applyPatch(t, patch) : t)),
        );

        const rollback = (message: string): void => {
          setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? snapshot : t)),
          );
          toast.error(message);
        };

        try {
          const res = await updateTask({ taskId, workspaceId, patch });
          if (!res.ok) rollback(res.error || "Couldn't save your change.");
        } catch {
          rollback("Couldn't save — check your connection.");
        }
      },

      createTask: async (title) => {
        const trimmed = title.trim();
        if (trimmed.length === 0) return;
        const tempId = `temp-${crypto.randomUUID()}`;
        const optimistic: Task = {
          id: tempId,
          title: trimmed,
          description: null,
          status: "todo",
          assigneeId: null,
          dueDate: null,
          createdAt: new Date().toISOString(),
        };
        setTasks((prev) => [optimistic, ...prev]);

        const rollback = (message: string): void => {
          setTasks((prev) => prev.filter((t) => t.id !== tempId));
          toast.error(message);
        };

        try {
          const res = await createTask({
            projectId,
            workspaceId,
            title: trimmed,
          });
          if (!res.ok) {
            rollback(res.error || "Couldn't add the task.");
            return;
          }
          // Swap temp id for the real one; if realtime already inserted the
          // real row, drop the duplicate.
          const realId = res.data.id;
          setTasks((prev) => {
            const hasReal = prev.some((t) => t.id === realId);
            if (hasReal) return prev.filter((t) => t.id !== tempId);
            return prev.map((t) => (t.id === tempId ? { ...t, id: realId } : t));
          });
        } catch {
          rollback("Couldn't add — check your connection.");
        }
      },

      deleteTask: async (taskId) => {
        const snapshot = tasksRef.current.find((t) => t.id === taskId);
        if (!snapshot) return;
        setTasks((prev) => prev.filter((t) => t.id !== taskId));

        const rollback = (message: string): void => {
          setTasks((prev) =>
            prev.some((t) => t.id === taskId)
              ? prev
              : [...prev, snapshot].sort((a, b) =>
                  a.createdAt < b.createdAt ? 1 : -1,
                ),
          );
          toast.error(message);
        };

        try {
          const res = await deleteTask({ taskId, workspaceId, projectId });
          if (!res.ok) rollback(res.error || "Couldn't delete the task.");
        } catch {
          rollback("Couldn't delete — check your connection.");
        }
      },
    }),
    [projectId, workspaceId],
  );

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

        <CreateTaskInline onCreate={actions.createTask} />

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
                  members={members}
                  onOpen={() => setOpenTaskId(t.id)}
                  onUpdate={(patch) => actions.updateTask(t.id, patch)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <TaskDetailSheet
        task={openTask}
        members={members}
        open={openTaskId !== null && openTask !== null}
        onOpenChange={(open) => {
          if (!open) setOpenTaskId(null);
        }}
        onUpdate={(patch) => {
          if (openTaskId) void actions.updateTask(openTaskId, patch);
        }}
        onDelete={() => {
          if (openTaskId) {
            const idToDelete = openTaskId;
            setOpenTaskId(null);
            void actions.deleteTask(idToDelete);
          }
        }}
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
