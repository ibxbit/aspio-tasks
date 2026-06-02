import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectView, type TaskStatus, type Member, type Task } from "./project-view";
import { OverdueTasksButton } from "./overdue-tasks-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wid: string; pid: string }>;
}): Promise<Metadata> {
  const { pid } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("name")
    .eq("id", pid)
    .returns<{ name: string }[]>()
    .maybeSingle();
  return { title: data?.name ?? "Project" };
}

type ProjectRow = {
  id: string;
  name: string;
  workspace_id: string;
};
type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  created_at: string;
};
type MemberRow = {
  user_id: string;
  role: "owner" | "member";
};
type ProfileRow = { id: string; display_name: string };

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ wid: string; pid: string }>;
}): Promise<React.ReactElement> {
  const { wid, pid } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, workspace_id")
    .eq("id", pid)
    .returns<ProjectRow[]>()
    .maybeSingle();

  if (!project || project.workspace_id !== wid) {
    notFound();
  }

  const [{ data: rawTasks }, { data: rawMembers }, { data: ws }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, description, status, assignee_id, due_date, created_at")
      .eq("project_id", pid)
      .order("created_at", { ascending: false })
      .returns<TaskRow[]>(),
    supabase
      .from("workspace_members")
      .select("user_id, role")
      .eq("workspace_id", wid)
      .returns<MemberRow[]>(),
    supabase
      .from("workspaces")
      .select("name")
      .eq("id", wid)
      .returns<{ name: string }[]>()
      .maybeSingle(),
  ]);

  // PostgREST can't infer a join workspace_members -> profiles because both
  // FK to auth.users, not to each other. Fetch profiles by id in a second
  // round-trip and merge.
  const memberIds = (rawMembers ?? []).map((m) => m.user_id);
  const { data: rawProfiles } =
    memberIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", memberIds)
          .returns<ProfileRow[]>()
      : { data: [] as ProfileRow[] };
  const profileById = new Map((rawProfiles ?? []).map((p) => [p.id, p.display_name]));

  const tasks: Task[] = (rawTasks ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status,
    assigneeId: t.assignee_id,
    dueDate: t.due_date,
    createdAt: t.created_at,
  }));

  const members: Member[] = (rawMembers ?? []).map((m) => ({
    id: m.user_id,
    displayName: profileById.get(m.user_id) ?? "Unknown",
    role: m.role,
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href={`/w/${wid}`}
              className="font-medium hover:text-foreground hover:underline"
            >
              {ws?.name ?? "Workspace"}
            </Link>
            <span aria-hidden>/</span>
            <span>Projects</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {project.name}
          </h1>
        </div>
        <OverdueTasksButton projectId={project.id} />
      </header>

      <ProjectView
        projectId={project.id}
        workspaceId={wid}
        tasks={tasks}
        members={members}
      />
    </div>
  );
}
