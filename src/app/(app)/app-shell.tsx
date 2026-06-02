import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { CrossMarker } from "@/components/ui/cross-marker";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggleButton } from "@/components/ui/ThemeSwitch";
import { WorkspaceSwitcher, type WorkspaceSummary } from "./workspace-switcher";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

type Props = {
  user: SessionUser;
  workspaces: WorkspaceSummary[];
  children: React.ReactNode;
};

export function AppShell({ user, workspaces, children }: Props): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-background font-mono [&_:not(input):not(textarea)]:tracking-tight">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/65">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-14 lg:px-28">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground focus-ring"
            >
              <span className="flex h-7 w-7 items-center justify-center bg-foreground font-mono text-xs font-semibold text-background">
                a/
              </span>
              <span className="hidden sm:inline tracking-[0.16em] uppercase text-[11px] text-muted-foreground">
                Aspio
              </span>
            </Link>
            {workspaces.length > 0 ? (
              <>
                <span className="shrink-0 text-muted-foreground/50" aria-hidden>
                  /
                </span>
                <div className="min-w-0 flex-1 sm:flex-initial">
                  <WorkspaceSwitcher workspaces={workspaces} />
                </div>
              </>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right text-xs leading-tight md:block">
              <div className="font-medium text-foreground">{user.displayName}</div>
              <div className="text-muted-foreground tabular-nums">{user.email}</div>
            </div>
            <Link
              href="/account"
              aria-label="Account settings"
              className="focus-ring"
            >
              <Avatar
                name={user.displayName}
                src={user.avatarUrl}
                size={32}
                className="text-xs"
              />
            </Link>
            <ThemeToggleButton variant="circle" start="top-right" className="size-8 border border-border" />
            <form action={signOut}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                aria-label="Sign out"
                className="px-2 sm:px-3"
              >
                <LogOut className="h-3.5 w-3.5 sm:hidden" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Fixed accent frame — verticals run the full viewport height (over
          the header). The horizontal line is inset from the viewport bottom
          so it reads as a real frame edge rather than getting buried behind
          the scrollbar. Offsets tighten on small screens so the frame stays
          out of content. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-y-0 left-3 z-40 w-px bg-border/70 sm:left-12 lg:left-24"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-y-0 right-3 z-40 w-px bg-border/70 sm:right-12 lg:right-24"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-6 inset-x-0 z-40 h-px bg-border/70 sm:bottom-12 lg:bottom-24"
      />

      {/* Crosses at intersections — header bottom border × verticals, and
          bottom line × verticals. */}
      <CrossMarker className="fixed left-3 top-[60px] z-50 -translate-x-1/2 -translate-y-1/2 sm:left-12 lg:left-24" />
      <CrossMarker className="fixed right-3 top-[60px] z-50 translate-x-1/2 -translate-y-1/2 sm:right-12 lg:right-24" />
      <CrossMarker className="fixed bottom-6 left-3 z-50 -translate-x-1/2 translate-y-1/2 sm:bottom-12 sm:left-12 lg:bottom-24 lg:left-24" />
      <CrossMarker className="fixed bottom-6 right-3 z-50 translate-x-1/2 translate-y-1/2 sm:bottom-12 sm:right-12 lg:bottom-24 lg:right-24" />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10 sm:px-14 sm:pb-28 sm:pt-12 lg:px-28 lg:pb-40">
        {children}
      </main>
    </div>
  );
}
