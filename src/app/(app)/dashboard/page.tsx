import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getMyWorkspaces } from "@/lib/data/workspaces";
import { CreateWorkspaceForm } from "./create-workspace-form";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage(): Promise<React.ReactElement> {
  const workspaces = await getMyWorkspaces();

  if (workspaces.length > 0) {
    redirect(`/w/${workspaces[0].id}`);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 pt-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <span className="font-mono text-sm font-semibold">a/</span>
      </div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          Welcome to Aspio Tasks
        </h1>
        <p className="text-sm text-muted-foreground">
          Workspaces hold projects, which hold tasks. Create your first one to
          get started.
        </p>
      </div>
      <div className="w-full">
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
