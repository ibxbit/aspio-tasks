"use client";

import { useRealtimeWorkspace } from "@/lib/realtime/use-realtime-workspace";

type Props = {
  workspaceId: string;
  projectIds: readonly string[];
};

/**
 * Headless client bridge: subscribes to workspace-scoped changes and
 * triggers a server re-render so the dashboard stays a Server Component
 * while still feeling live.
 */
export function WorkspaceRealtimeBridge({
  workspaceId,
  projectIds,
}: Props): null {
  useRealtimeWorkspace(workspaceId, projectIds);
  return null;
}
