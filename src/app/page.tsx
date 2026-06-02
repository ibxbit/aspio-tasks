import Link from "next/link";

export default function RootPage(): React.ReactElement {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <span className="font-mono text-lg font-semibold">a/</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Aspio Tasks</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Workspace task management.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-ring"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-surface-foreground transition-colors hover:bg-muted focus-ring"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
