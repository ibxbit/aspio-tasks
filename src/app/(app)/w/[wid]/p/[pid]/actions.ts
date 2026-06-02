"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const TaskStatus = z.enum(["todo", "in_progress", "done"]);
// Loose UUID format — Postgres accepts any well-formed UUID, not only
// RFC 4122 v4. Strict zod .uuid() rejects seeded fixture IDs.
const Uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid ID");

const CreateTaskSchema = z.object({
  projectId: Uuid,
  workspaceId: Uuid,
  title: z.string().trim().min(1).max(200),
});

const UpdateTaskSchema = z.object({
  taskId: Uuid,
  workspaceId: Uuid,
  patch: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      status: TaskStatus.optional(),
      assignee_id: Uuid.nullable().optional(),
      due_date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable()
        .optional(),
    })
    .refine((v) => Object.keys(v).length > 0, {
      message: "Nothing to update.",
    }),
});

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function createTask(
  input: z.input<typeof CreateTaskSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = CreateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .insert({ project_id: parsed.data.projectId, title: parsed.data.title })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  const id = typeof data?.id === "string" ? data.id : null;
  if (!id) return { ok: false, error: "Could not create task." };

  revalidatePath(`/w/${parsed.data.workspaceId}/p/${parsed.data.projectId}`);
  return { ok: true, data: { id } };
}

export async function updateTask(
  input: z.input<typeof UpdateTaskSchema>,
): Promise<ActionResult> {
  const parsed = UpdateTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update(parsed.data.patch)
    .eq("id", parsed.data.taskId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/w/${parsed.data.workspaceId}`, "layout");
  return { ok: true, data: undefined };
}

export async function deleteTask(input: {
  taskId: string;
  workspaceId: string;
  projectId: string;
}): Promise<ActionResult> {
  const id = Uuid.safeParse(input.taskId);
  const wid = Uuid.safeParse(input.workspaceId);
  const pid = Uuid.safeParse(input.projectId);
  if (!id.success || !wid.success || !pid.success) {
    return { ok: false, error: "Invalid input." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rpc_delete_task", {
    target_task_id: id.data,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/w/${wid.data}/p/${pid.data}`);
  return { ok: true, data: undefined };
}
