import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CardCorners } from "@/components/ui/card-corners";
import { Avatar } from "@/components/ui/avatar";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage(): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    typeof profile?.display_name === "string" ? profile.display_name : "";
  const avatarUrl =
    typeof profile?.avatar_url === "string" && profile.avatar_url.length > 0
      ? profile.avatar_url
      : null;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <header className="space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-sm text-muted-foreground">
          How you show up across workspaces. Avatar URL is optional.
        </p>
      </header>

      <section className="relative border border-border bg-surface p-6">
        <CardCorners />
        <div className="mb-5 flex items-center gap-4">
          <Avatar
            name={displayName || (user.email ?? "?")}
            src={avatarUrl}
            size={56}
            className="text-base"
          />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-medium">{displayName || "—"}</p>
            <p className="truncate text-xs text-muted-foreground tabular-nums">
              {user.email}
            </p>
          </div>
        </div>
        <ProfileForm
          initialDisplayName={displayName}
          initialAvatarUrl={avatarUrl ?? ""}
        />
      </section>
    </div>
  );
}
