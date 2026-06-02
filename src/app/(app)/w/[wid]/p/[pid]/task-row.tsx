"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronRight, UserRound } from "lucide-react";
import { format, parseISO, isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTask } from "./actions";
import type { Member, Task, TaskStatus } from "./project-view";

const STATUS_META: Record<TaskStatus, { label: string; cls: string }> = {
  todo: {
    label: "Todo",
    cls: "bg-[color:var(--color-status-todo-bg)] text-[color:var(--color-status-todo-fg)] border-[color:var(--color-status-todo-border)]",
  },
  in_progress: {
    label: "In progress",
    cls: "bg-[color:var(--color-status-progress-bg)] text-[color:var(--color-status-progress-fg)] border-[color:var(--color-status-progress-border)]",
  },
  done: {
    label: "Done",
    cls: "bg-[color:var(--color-status-done-bg)] text-[color:var(--color-status-done-fg)] border-[color:var(--color-status-done-border)]",
  },
};

type Props = {
  task: Task;
  workspaceId: string;
  members: Member[];
  onOpen: () => void;
  onError: (msg: string) => void;
};

export function TaskRow({
  task,
  workspaceId,
  members,
  onOpen,
  onError,
}: Props): React.ReactElement {
  const router = useRouter();
  const [, startTransition] = React.useTransition();

  const runUpdate = (patch: Parameters<typeof updateTask>[0]["patch"]): void => {
    startTransition(async () => {
      const res = await updateTask({ taskId: task.id, workspaceId, patch });
      if (!res.ok) onError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40">
      <StatusButton
        status={task.status}
        onChange={(s) => runUpdate({ status: s })}
      />

      <TitleField
        title={task.title}
        onSave={(next) => runUpdate({ title: next })}
        onOpen={onOpen}
      />

      <AssigneeButton
        assigneeId={task.assigneeId}
        members={members}
        onChange={(id) => runUpdate({ assignee_id: id })}
      />

      <DueDateField
        dueDate={task.dueDate}
        status={task.status}
        onChange={(d) => runUpdate({ due_date: d })}
      />

      <button
        type="button"
        onClick={onOpen}
        aria-label="Open task detail"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-ring"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatusButton({
  status,
  onChange,
}: {
  status: TaskStatus;
  onChange: (next: TaskStatus) => void;
}): React.ReactElement {
  const meta = STATUS_META[status];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-none transition-[transform,filter] hover:brightness-95 active:scale-[0.96] focus-ring",
          meta.cls,
        )}
        aria-label={`Status: ${meta.label}`}
      >
        {meta.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => onChange(s)}
            className={cn(s === status && "bg-muted")}
          >
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 text-[10px] font-medium leading-none",
                STATUS_META[s].cls,
              )}
            >
              {STATUS_META[s].label}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TitleField({
  title,
  onSave,
  onOpen,
}: {
  title: string;
  onSave: (next: string) => void;
  onOpen: () => void;
}): React.ReactElement {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(title);
  const [lastSeenTitle, setLastSeenTitle] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Conditional setState during render — recommended pattern for syncing
  // local state with an external prop without an effect.
  if (title !== lastSeenTitle) {
    setLastSeenTitle(title);
    setDraft(title);
  }

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commit = (): void => {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || trimmed === title) {
      setDraft(title);
      setEditing(false);
      return;
    }
    onSave(trimmed);
    setEditing(false);
  };

  const cancel = (): void => {
    setDraft(title);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          else if (e.key === "Escape") cancel();
        }}
        maxLength={200}
        className="flex-1 rounded-md border border-input bg-surface px-2 py-1 text-sm font-medium focus-ring focus-visible:border-ring"
      />
    );
  }

  return (
    <button
      type="button"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onClick={onOpen}
      className="flex-1 truncate rounded-md px-2 py-1 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted focus-ring"
      aria-label={`Open ${title}. Double-click to rename.`}
    >
      {title}
    </button>
  );
}

function AssigneeButton({
  assigneeId,
  members,
  onChange,
}: {
  assigneeId: string | null;
  members: Member[];
  onChange: (next: string | null) => void;
}): React.ReactElement {
  const current = assigneeId ? members.find((m) => m.id === assigneeId) : null;

  const initials = current
    ? current.displayName
        .split(/\s+/)
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-ring"
        aria-label={current ? `Assignee: ${current.displayName}` : "Assign"}
      >
        {current ? (
          <>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
              {initials}
            </span>
            <span className="hidden sm:inline">{current.displayName}</span>
          </>
        ) : (
          <>
            <UserRound className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Unassigned</span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[12rem]">
        <DropdownMenuLabel>Assignee</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => onChange(null)}>Unassigned</DropdownMenuItem>
        {members.length > 0 ? <DropdownMenuSeparator /> : null}
        {members.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onSelect={() => onChange(m.id)}
            className={cn(m.id === assigneeId && "bg-muted")}
          >
            {m.displayName}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function DueDateField({
  dueDate,
  status,
  onChange,
}: {
  dueDate: string | null;
  status: TaskStatus;
  onChange: (next: string | null) => void;
}): React.ReactElement {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const open = (): void => {
    const el = inputRef.current;
    if (!el) return;
    // Native picker; falls back to focus on browsers without showPicker.
    if ("showPicker" in el && typeof el.showPicker === "function") {
      try {
        el.showPicker();
      } catch {
        el.focus();
      }
    } else {
      el.focus();
    }
  };

  const parsed = dueDate ? parseISO(dueDate) : null;
  const overdue =
    parsed !== null &&
    status !== "done" &&
    isPast(parsed) &&
    !isToday(parsed);
  const due =
    parsed !== null && status !== "done" && isToday(parsed);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={open}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs transition-colors hover:bg-muted focus-ring",
          overdue
            ? "text-destructive"
            : due
              ? "text-[color:var(--color-warning)]"
              : "text-muted-foreground hover:text-foreground",
        )}
        aria-label={dueDate ? `Due ${dueDate}` : "Set due date"}
      >
        <Calendar className="h-3.5 w-3.5" />
        <span className="hidden sm:inline tabular-nums">
          {parsed ? format(parsed, "MMM d") : "No date"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={dueDate ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className="absolute inset-0 h-0 w-0 opacity-0"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
