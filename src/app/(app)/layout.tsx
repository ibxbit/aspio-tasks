import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyWorkspaces } from "@/lib/data/workspaces";
import { AppShell } from "./app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, workspaces] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    getMyWorkspaces(),
  ]);

  const displayName =
    typeof profile?.display_name === "string" && profile.display_name.length > 0
      ? profile.display_name
      : (user.email?.split("@")[0] ?? "You");
  const avatarUrl =
    typeof profile?.avatar_url === "string" && profile.avatar_url.length > 0
      ? profile.avatar_url
      : null;

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email ?? "",
        displayName,
        avatarUrl,
      }}
      workspaces={workspaces}
    >
      {children}
    </AppShell>
  );
}
