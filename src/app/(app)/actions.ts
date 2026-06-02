"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MutationState = {
  formError?: string;
  fieldErrors?: { name?: string };
};

const NameSchema = z
  .string()
  .trim()
  .min(1, "Give it a name.")
  .max(80, "Maximum 80 characters.");

export async function createWorkspace(
  _prev: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = NameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { fieldErrors: { name: parsed.error.issues[0]?.message } };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("rpc_create_workspace", {
    workspace_name: parsed.data,
  });

  if (error) {
    return { formError: error.message };
  }
  if (typeof data !== "string") {
    return { formError: "Could not create workspace." };
  }

  revalidatePath("/", "layout");
  redirect(`/w/${data}`);
}

export async function createProject(
  workspaceId: string,
  _prev: MutationState,
  formData: FormData,
): Promise<MutationState> {
  const parsed = NameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { fieldErrors: { name: parsed.error.issues[0]?.message } };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_create_project", {
    target_workspace_id: workspaceId,
    project_name: parsed.data,
  });

  if (error) {
    return { formError: error.message };
  }

  revalidatePath(`/w/${workspaceId}`);
  return {};
}

export type DeleteProjectResult = { ok: true } | { ok: false; error: string };

export async function deleteProject(
  workspaceId: string,
  projectId: string,
): Promise<DeleteProjectResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_delete_project", {
    target_project_id: projectId,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  revalidatePath(`/w/${workspaceId}`);
  return { ok: true };
}

export type LeaveWorkspaceResult = { ok: true } | { ok: false; error: string };

export async function leaveWorkspace(
  workspaceId: string,
): Promise<LeaveWorkspaceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not signed in." };
  }

  // Refuse cleanly when the caller is the last owner — leaving without a
  // successor would orphan every project in the workspace.
  const { data: myRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myRow) {
    return { ok: false, error: "You're not a member of this workspace." };
  }

  if (myRow.role === "owner") {
    const { count } = await supabase
      .from("workspace_members")
      .select("user_id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) {
      return {
        ok: false,
        error:
          "You're the last owner. Promote another member to owner first, or delete the workspace.",
      };
    }
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
