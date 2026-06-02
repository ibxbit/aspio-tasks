"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Member, Task, TaskPatch, TaskStatus } from "./project-view";

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

type Props = {
  task: Task | null;
  members: Member[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (patch: TaskPatch) => void;
  onDelete: () => void;
};

export function TaskDetailSheet({
  task,
  members,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: Props): React.ReactElement {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        {task ? (
          <Body
            task={task}
            members={members}
            onClose={() => onOpenChange(false)}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ) : (
          <SheetHeader>
            <SheetTitle>Task</SheetTitle>
            <SheetDescription>No task selected.</SheetDescription>
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Body({
  task,
  members,
  onClose,
  onUpdate,
  onDelete,
}: {
  task: Task;
  members: Member[];
  onClose: () => void;
  onUpdate: (patch: TaskPatch) => void;
  onDelete: () => void;
}): React.ReactElement {
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description ?? "");
  const [lastSeenId, setLastSeenId] = React.useState(task.id);

  // Conditional setState during render — recommended over a sync effect.
  if (task.id !== lastSeenId) {
    setLastSeenId(task.id);
    setTitle(task.title);
    setDescription(task.description ?? "");
  }

  const onTitleBlur = (): void => {
    const trimmed = title.trim();
    if (trimmed.length === 0 || trimmed === task.title) {
      setTitle(task.title);
      return;
    }
    onUpdate({ title: trimmed });
  };

  const onDescBlur = (): void => {
    const next = description.trim() === "" ? null : description;
    if (next === task.description) return;
    onUpdate({ description: next });
  };

  const assignee = task.assigneeId
    ? members.find((m) => m.id === task.assigneeId)
    : null;

  return (
    <>
      <SheetHeader>
        <SheetTitle>Task</SheetTitle>
        <SheetDescription>
          Edits save when you click out of a field.
        </SheetDescription>
      </SheetHeader>

      <SheetBody className="space-y-5">
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            maxLength={200}
            className="text-base font-medium"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={onDescBlur}
            placeholder="Add detail…"
            maxLength={2000}
            rows={5}
            className="block w-full resize-none rounded-md border border-input bg-surface px-3 py-2 text-sm text-surface-foreground placeholder:text-muted-foreground focus-ring focus-visible:border-ring"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full rounded-md border border-input bg-surface px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-ring">
                {STATUSES.find((s) => s.value === task.status)?.label ?? task.status}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                {STATUSES.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onSelect={() => onUpdate({ status: s.value })}
                    className={cn(s.value === task.status && "bg-muted")}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>

          <Field label="Assignee">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md border border-input bg-surface px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-ring">
                {assignee ? (
                  <>
                    <Avatar name={assignee.displayName} src={assignee.avatarUrl} size={20} />
                    <span className="truncate">{assignee.displayName}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                <DropdownMenuLabel>Assignee</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => onUpdate({ assignee_id: null })}>
                  Unassigned
                </DropdownMenuItem>
                {members.length > 0 ? <DropdownMenuSeparator /> : null}
                {members.map((m) => (
                  <DropdownMenuItem
                    key={m.id}
                    onSelect={() => onUpdate({ assignee_id: m.id })}
                    className={cn("gap-2", m.id === task.assigneeId && "bg-muted")}
                  >
                    <Avatar name={m.displayName} src={m.avatarUrl} size={20} />
                    <span className="truncate">{m.displayName}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </Field>

          <Field label="Due date">
            <input
              type="date"
              value={task.dueDate ?? ""}
              onChange={(e) =>
                onUpdate({ due_date: e.target.value === "" ? null : e.target.value })
              }
              className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus-ring focus-visible:border-ring"
            />
          </Field>

          <Field label="Created">
            <p className="px-3 py-2 text-sm text-muted-foreground tabular-nums">
              {format(parseISO(task.createdAt), "MMM d, yyyy")}
            </p>
          </Field>
        </div>
      </SheetBody>

      <SheetFooter>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete task
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </SheetFooter>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
