import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const displayName =
    typeof profile?.display_name === "string" && profile.display_name.length > 0
      ? profile.display_name
      : (user.email?.split("@")[0] ?? "You");

  return (
    <AppShell
      user={{
        id: user.id,
        email: user.email ?? "",
        displayName,
      }}
    >
      {children}
    </AppShell>
  );
}
