"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Refreshes the current route whenever a task in any of the workspace's
 * projects changes, or whenever a project in the workspace itself is
 * created or removed. We use router.refresh() rather than client-side
 * patching because the dashboard reads aggregate counts in an RSC — the
 * server is the source of truth and re-rendering it is cheap.
 *
 * Realtime postgres_changes only reliably supports single-value filter
 * operators, so we subscribe to all tasks the user can see (RLS scopes
 * the stream) and drop events whose project_id isn't in our set.
 */
export function useRealtimeWorkspace(
  workspaceId: string,
  projectIds: readonly string[],
): void {
  const router = useRouter();
  const projectIdsRef = useRef<Set<string>>(new Set(projectIds));

  useEffect(() => {
    projectIdsRef.current = new Set(projectIds);
  }, [projectIds]);

  useEffect(() => {
    const supabase = createClient();
    let projectsChannel: ReturnType<typeof supabase.channel> | null = null;
    let tasksChannel: ReturnType<typeof supabase.channel> | null = null;
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

      projectsChannel = supabase
        .channel(`projects:workspace:${workspaceId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "projects",
            filter: `workspace_id=eq.${workspaceId}`,
          },
          () => router.refresh(),
        )
        .subscribe();

      tasksChannel = supabase
        .channel(`tasks:workspace-feed:${workspaceId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks" },
          (payload) => {
            const row =
              (payload.new as { project_id?: string } | null) ??
              (payload.old as { project_id?: string } | null);
            const pid = row?.project_id;
            if (typeof pid === "string" && projectIdsRef.current.has(pid)) {
              router.refresh();
            }
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (projectsChannel) void supabase.removeChannel(projectsChannel);
      if (tasksChannel) void supabase.removeChannel(tasksChannel);
    };
  }, [workspaceId, router]);
}
