import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CardCorners } from "@/components/ui/card-corners";
import { CreateProjectForm } from "./create-project-form";
import { LeaveWorkspaceButton } from "./leave-workspace-button";
import { WorkspaceRealtimeBridge } from "./realtime-bridge";

type TaskStatus = "todo" | "in_progress" | "done";

type ProjectWithCounts = {
  id: string;
  name: string;
  createdAt: string;
  counts: Record<TaskStatus, number>;
  total: number;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wid: string }>;
}): Promise<Metadata> {
  const { wid } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", wid)
    .maybeSingle();
  const name = typeof data?.name === "string" ? data.name : "Workspace";
  return { title: name };
}

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ wid: string }>;
}): Promise<React.ReactElement> {
  const { wid } = await params;
  const supabase = await createClient();

  type WorkspaceRow = { id: string; name: string };
  type ProjectRow = {
    id: string;
    name: string;
    created_at: string;
    tasks: { status: TaskStatus }[];
  };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", wid)
    .returns<WorkspaceRow[]>()
    .maybeSingle();

  if (!workspace) {
    notFound();
  }

  const { data: rawProjects } = await supabase
    .from("projects")
    .select("id, name, created_at, tasks(status)")
    .eq("workspace_id", wid)
    .order("created_at", { ascending: false })
    .returns<ProjectRow[]>();

  const projects: ProjectWithCounts[] = (rawProjects ?? []).map((p) => {
    const counts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 };
    for (const t of p.tasks) {
      counts[t.status] += 1;
    }
    return {
      id: p.id,
      name: p.name,
      createdAt: p.created_at,
      counts,
      total: p.tasks.length,
    };
  });

  const workspaceName = workspace.name;
  const projectIds = projects.map((p) => p.id);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myRole: "owner" | "member" | null = null;
  if (user) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", wid)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership?.role === "owner" || membership?.role === "member") {
      myRole = membership.role;
    }
  }

  const { count: ownerCount } = await supabase
    .from("workspace_members")
    .select("user_id", { count: "exact", head: true })
    .eq("workspace_id", wid)
    .eq("role", "owner");

  return (
    <div className="space-y-8">
      <WorkspaceRealtimeBridge workspaceId={wid} projectIds={projectIds} />
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">{workspaceName}</h1>
        </div>
        {myRole !== null ? (
          <LeaveWorkspaceButton
            workspaceId={wid}
            workspaceName={workspaceName}
            myRole={myRole}
            isLastOwner={myRole === "owner" && (ownerCount ?? 0) <= 1}
          />
        ) : null}
      </header>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-sm font-medium text-subtle-foreground">Projects</h2>
        </div>

        <CreateProjectForm workspaceId={wid} />

        {projects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-10 text-center text-sm text-muted-foreground">
            No projects yet. Create one above to get started.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/w/${wid}/p/${p.id}`}
                  className="group relative block border border-border bg-surface p-4 shadow-xs transition-[border-color,box-shadow,transform] hover:border-border-strong hover:shadow-sm focus-ring"
                >
                  <CardCorners />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <h3 className="truncate text-sm font-semibold tracking-tight">
                        {p.name}
                      </h3>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {p.total} task{p.total === 1 ? "" : "s"}
                      </p>
                    </div>
                    <span
                      aria-hidden
                      className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    >
                      →
                    </span>
                  </div>
                  <StatusCounts counts={p.counts} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusCounts({
  counts,
}: {
  counts: Record<TaskStatus, number>;
}): React.ReactElement {
  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      <StatusChip
        label="Todo"
        count={counts.todo}
        fg="text-[color:var(--color-status-todo-fg)]"
        bg="bg-[color:var(--color-status-todo-bg)]"
      />
      <StatusChip
        label="In progress"
        count={counts.in_progress}
        fg="text-[color:var(--color-status-progress-fg)]"
        bg="bg-[color:var(--color-status-progress-bg)]"
      />
      <StatusChip
        label="Done"
        count={counts.done}
        fg="text-[color:var(--color-status-done-fg)]"
        bg="bg-[color:var(--color-status-done-bg)]"
      />
    </div>
  );
}

function StatusChip({
  label,
  count,
  fg,
  bg,
}: {
  label: string;
  count: number;
  fg: string;
  bg: string;
}): React.ReactElement {
  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium tabular-nums ${bg} ${fg}`}
    >
      <span aria-hidden className="text-[10px] uppercase tracking-wide opacity-80">
        {label}
      </span>
      <span>{count}</span>
    </span>
  );
}
