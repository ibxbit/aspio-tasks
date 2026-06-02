"use client";

import { useEffect } from "react";
import type {
  RealtimePostgresChangesPayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Task, TaskStatus } from "@/app/(app)/w/[wid]/p/[pid]/project-view";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
};

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    assigneeId: row.assignee_id,
    dueDate: row.due_date,
    createdAt: row.created_at,
  };
}

export type TaskRealtimeHandlers = {
  onInsert: (task: Task) => void;
  onUpdate: (task: Task) => void;
  onDelete: (id: string) => void;
};

/**
 * Subscribes to tasks-table changes scoped to one project.
 * Cleans the channel up on unmount.
 */
export function useRealtimeTasks(
  projectId: string,
  handlers: TaskRealtimeHandlers,
): void {
  // Refs would over-engineer this — the handlers are stable (memoised by the
  // caller) and the subscription only depends on projectId.
  const { onInsert, onUpdate, onDelete } = handlers;

  useEffect(() => {
    const supabase = createClient();

    // RLS on postgres_changes is evaluated against the JWT attached to the
    // realtime socket. The SSR browser client doesn't wire the access token
    // into realtime automatically — pull it from the session and setAuth
    // before subscribing, otherwise events get suppressed as anon.
    let channelRef: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.access_token) {
        await supabase.realtime.setAuth(session.access_token);
      }
      if (cancelled) return;

      channelRef = supabase
        .channel(`tasks:project:${projectId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "tasks",
            filter: `project_id=eq.${projectId}`,
          },
          (payload: RealtimePostgresChangesPayload<TaskRow>) => {
            if (payload.eventType === "INSERT") {
              const p = payload as RealtimePostgresInsertPayload<TaskRow>;
              onInsert(rowToTask(p.new));
            } else if (payload.eventType === "UPDATE") {
              const p = payload as RealtimePostgresUpdatePayload<TaskRow>;
              onUpdate(rowToTask(p.new));
            } else if (payload.eventType === "DELETE") {
              const p = payload as RealtimePostgresDeletePayload<TaskRow>;
              const id = (p.old as Partial<TaskRow>).id;
              if (typeof id === "string") onDelete(id);
            }
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channelRef) void supabase.removeChannel(channelRef);
    };
  }, [projectId, onInsert, onUpdate, onDelete]);
}
