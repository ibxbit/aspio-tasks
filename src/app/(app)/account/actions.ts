"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = {
  ok?: boolean;
  formError?: string;
  fieldErrors?: { displayName?: string; avatarUrl?: string };
};

const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, "Give yourself a name.")
  .max(80, "Maximum 80 characters.");

const AvatarUrlSchema = z
  .string()
  .trim()
  .max(2048, "URL too long.")
  .refine((v) => v === "" || /^https?:\/\//i.test(v), {
    message: "Must be an http(s) URL.",
  });

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { formError: "Not signed in." };
  }

  const nameRes = DisplayNameSchema.safeParse(formData.get("displayName"));
  const urlRes = AvatarUrlSchema.safeParse(formData.get("avatarUrl") ?? "");

  if (!nameRes.success || !urlRes.success) {
    return {
      fieldErrors: {
        displayName: nameRes.success
          ? undefined
          : nameRes.error.issues[0]?.message,
        avatarUrl: urlRes.success ? undefined : urlRes.error.issues[0]?.message,
      },
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: nameRes.data,
      avatar_url: urlRes.data === "" ? null : urlRes.data,
    })
    .eq("id", user.id);

  if (error) {
    return { formError: error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
