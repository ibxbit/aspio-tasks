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
