"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  formError?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "display_name", string>>;
};

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

const SignUpSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(72, "Maximum 72 characters."),
  display_name: z
    .string()
    .trim()
    .min(1, "Tell us your name.")
    .max(80, "Maximum 80 characters."),
});

function fieldErrorsFromZod(
  issues: z.ZodIssue[],
): AuthState["fieldErrors"] {
  const out: NonNullable<AuthState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (key === "email" || key === "password" || key === "display_name") {
      out[key] = issue.message;
    }
  }
  return out;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { formError: "Invalid email or password." };
  }

  const next =
    typeof formData.get("next") === "string"
      ? (formData.get("next") as string)
      : "/dashboard";

  revalidatePath("/", "layout");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = SignUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    display_name: formData.get("display_name"),
  });

  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFromZod(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.display_name } },
  });

  if (error) {
    return { formError: error.message };
  }

  // If email confirmation is enabled on the project, the session is null
  // and the user must verify before signing in.
  if (!data.session) {
    return {
      formError:
        "Check your inbox to confirm your email, then sign in.",
    };
  }

  // First workspace so the dashboard isn't empty on first visit.
  // The on_workspace_created trigger auto-adds the user as owner.
  await supabase
    .from("workspaces")
    .insert({ name: `${parsed.data.display_name}'s Workspace` });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
