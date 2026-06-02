import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { WorkspaceSwitcher, type WorkspaceSummary } from "./workspace-switcher";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
};

type Props = {
  user: SessionUser;
  workspaces: WorkspaceSummary[];
  children: React.ReactNode;
};

export function AppShell({ user, workspaces, children }: Props): React.ReactElement {
  const initials =
    user.displayName
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-xs">
                a/
              </span>
              <span className="hidden sm:inline">Aspio Tasks</span>
            </Link>
            {workspaces.length > 0 ? (
              <>
                <span className="text-muted-foreground" aria-hidden>
                  /
                </span>
                <WorkspaceSwitcher workspaces={workspaces} />
              </>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs leading-tight sm:block">
              <div className="font-medium text-foreground">{user.displayName}</div>
              <div className="text-muted-foreground">{user.email}</div>
            </div>
            <div
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
            >
              {initials}
            </div>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
