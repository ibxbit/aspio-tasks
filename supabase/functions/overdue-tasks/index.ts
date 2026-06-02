// Supabase Edge Function: overdue-tasks
//
// POST { project_id: string } -> { tasks: OverdueTask[] }
//
// Uses the caller's JWT so RLS still applies. A user cannot ask for tasks
// in a project that sits outside any workspace they belong to.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type OverdueTask = {
  id: string;
  title: string;
  status: "todo" | "in_progress";
  due_date: string;
  assignee_id: string | null;
  assignee_name: string | null;
};

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing Authorization header" }, 401);
  }

  let body: { project_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const projectId = body.project_id;
  if (typeof projectId !== "string" || projectId.length === 0) {
    return json({ error: "project_id is required" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return json({ error: "Server misconfigured" }, 500);
  }

  // RLS-honouring client: passes the caller's JWT through to PostgREST.
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const today = new Date().toISOString().slice(0, 10);

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, title, status, due_date, assignee_id")
    .eq("project_id", projectId)
    .neq("status", "done")
    .lt("due_date", today)
    .order("due_date", { ascending: true });

  if (error) {
    return json({ error: error.message }, 400);
  }
  if (!tasks || tasks.length === 0) {
    return json({ tasks: [] satisfies OverdueTask[] });
  }

  const assigneeIds = Array.from(
    new Set(
      tasks
        .map((t) => t.assignee_id)
        .filter((v): v is string => typeof v === "string"),
    ),
  );

  const nameById = new Map<string, string>();
  if (assigneeIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", assigneeIds);
    for (const p of profiles ?? []) {
      if (typeof p.id === "string" && typeof p.display_name === "string") {
        nameById.set(p.id, p.display_name);
      }
    }
  }

  const out: OverdueTask[] = tasks.map((t) => ({
    id: String(t.id),
    title: String(t.title),
    status: t.status as "todo" | "in_progress",
    due_date: String(t.due_date),
    assignee_id: typeof t.assignee_id === "string" ? t.assignee_id : null,
    assignee_name:
      typeof t.assignee_id === "string"
        ? (nameById.get(t.assignee_id) ?? null)
        : null,
  }));

  return json({ tasks: out });
});
