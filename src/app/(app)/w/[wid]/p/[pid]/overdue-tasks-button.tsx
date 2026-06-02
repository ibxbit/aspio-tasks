"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type OverdueTask = {
  id: string;
  title: string;
  status: "todo" | "in_progress";
  due_date: string;
  assignee_id: string | null;
  assignee_name: string | null;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; tasks: OverdueTask[] };

type Props = { projectId: string };

export function OverdueTasksButton({ projectId }: Props): React.ReactElement {
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<State>({ kind: "idle" });

  const run = React.useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const supabase = createClient();
      const { data, error } = await supabase.functions.invoke<{
        tasks?: OverdueTask[];
        error?: string;
      }>("overdue-tasks", { body: { project_id: projectId } });

      if (error) {
        setState({ kind: "error", message: error.message });
        return;
      }
      if (!data) {
        setState({ kind: "error", message: "Empty response from server." });
        return;
      }
      if (data.error) {
        setState({ kind: "error", message: data.error });
        return;
      }
      setState({ kind: "ready", tasks: data.tasks ?? [] });
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, [projectId]);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && state.kind === "idle") void run();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <AlertTriangle className="h-3.5 w-3.5" />
          Overdue tasks
        </Button>
      </SheetTrigger>

      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Overdue tasks</SheetTitle>
          <SheetDescription>
            Tasks with a due date in the past that aren&apos;t marked done.
            Fetched live via the <code className="font-mono">overdue-tasks</code>{" "}
            edge function — RLS still applies.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {state.kind === "loading" ? (
            <Loading />
          ) : state.kind === "error" ? (
            <ErrorState message={state.message} onRetry={() => void run()} />
          ) : state.kind === "ready" ? (
            state.tasks.length === 0 ? (
              <EmptyState />
            ) : (
              <ResultList tasks={state.tasks} />
            )
          ) : (
            <Loading />
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

function Loading(): React.ReactElement {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Checking the database…
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): React.ReactElement {
  return (
    <div className="space-y-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm text-destructive">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      Nothing overdue. You&apos;re ahead of the curve.
    </div>
  );
}

function ResultList({
  tasks,
}: {
  tasks: OverdueTask[];
}): React.ReactElement {
  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-surface">
      {tasks.map((t) => {
        const due = parseISO(t.due_date);
        return (
          <li key={t.id} className="flex items-start gap-3 px-3 py-2.5">
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-sm font-medium">{t.title}</p>
              <p className="text-xs text-muted-foreground">
                <span className="tabular-nums">{format(due, "MMM d")}</span>
                <span className="mx-1.5" aria-hidden>
                  ·
                </span>
                <span className="capitalize">{t.status.replace("_", " ")}</span>
                <span className="mx-1.5" aria-hidden>
                  ·
                </span>
                <span>{t.assignee_name ?? "Unassigned"}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
