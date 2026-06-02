import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { WorkspaceSummary } from "@/app/(app)/workspace-switcher";

type MembershipRow = {
  role: "owner" | "member";
  workspaces: { id: string; name: string } | null;
};

export const getMyWorkspaces = cache(async (): Promise<WorkspaceSummary[]> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("workspace_members")
    .select("role, workspaces(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .returns<MembershipRow[]>();

  if (!data) return [];

  return data
    .map((m): WorkspaceSummary | null => {
      if (!m.workspaces) return null;
      return { id: m.workspaces.id, name: m.workspaces.name, role: m.role };
    })
    .filter((w): w is WorkspaceSummary => w !== null);
});
