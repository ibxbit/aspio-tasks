import Link from "next/link";
import type { Metadata } from "next";
import { CreateWorkspaceForm } from "../../dashboard/create-workspace-form";

export const metadata: Metadata = {
  title: "New workspace",
};

export default function NewWorkspacePage(): React.ReactElement {
  return (
    <div className="mx-auto max-w-md space-y-6 pt-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">New workspace</h1>
        <p className="text-sm text-muted-foreground">
          Each workspace has its own projects, tasks, and members.
        </p>
      </div>

      <CreateWorkspaceForm />

      <p className="text-sm text-muted-foreground">
        <Link href="/dashboard" className="text-primary hover:underline">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
