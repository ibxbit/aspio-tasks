-- aspio-tasks: schema, RLS, and seed. Runs in a single execution against a
-- fresh Supabase project. Idempotent — re-running drops and recreates.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- Teardown (so this file is re-runnable)
-- ============================================================
drop trigger if exists on_workspace_created on public.workspaces;
drop trigger if exists on_auth_user_created on auth.users;

drop function if exists public.handle_new_workspace();
drop function if exists public.handle_new_user();
drop function if exists public.is_workspace_owner(uuid);
drop function if exists public.is_workspace_member(uuid);

drop table if exists public.tasks cascade;
drop table if exists public.projects cascade;
drop table if exists public.workspace_members cascade;
drop table if exists public.workspaces cascade;
drop table if exists public.profiles cascade;

drop type if exists public.task_status;
drop type if exists public.member_role;

-- Demo users from a previous run, if any.
delete from auth.identities
  where user_id in (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  );
delete from auth.users where email in ('demo@aspio.dev', 'alex@aspio.dev');

-- ============================================================
-- Enums
-- ============================================================
create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.member_role as enum ('owner', 'member');

-- ============================================================
-- Tables
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 80),
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(name) between 1 and 80),
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.member_role not null default 'member',
  created_at   timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null check (length(name) between 1 and 80),
  created_at   timestamptz not null default now()
);

create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null check (length(title) between 1 and 200),
  description text,
  status      public.task_status not null default 'todo',
  assignee_id uuid references auth.users(id) on delete set null,
  due_date    date,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index workspace_members_user_idx       on public.workspace_members(user_id);
create index projects_workspace_idx           on public.projects(workspace_id);
create index tasks_project_idx                on public.tasks(project_id);
create index tasks_project_status_idx         on public.tasks(project_id, status);
create index tasks_project_assignee_idx       on public.tasks(project_id, assignee_id);
create index tasks_project_due_idx            on public.tasks(project_id, due_date);

-- ============================================================
-- Helper functions for RLS
--
-- SECURITY DEFINER so they bypass workspace_members' own RLS — otherwise
-- the membership check would recurse into itself. Search path is locked
-- to prevent privilege-escalation via shadowing.
-- ============================================================
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(ws_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- ============================================================
-- Triggers
-- ============================================================

-- Mirror new auth users into public.profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'display_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- When an authenticated user creates a workspace, add them as owner.
-- Skipped during SQL seed where auth.uid() is null.
create or replace function public.handle_new_workspace()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (new.id, auth.uid(), 'owner');
  end if;
  return new;
end;
$$;

create trigger on_workspace_created
after insert on public.workspaces
for each row execute function public.handle_new_workspace();

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects          enable row level security;
alter table public.tasks             enable row level security;

-- profiles ---------------------------------------------------
create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);

create policy profiles_insert_self on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy profiles_delete_self on public.profiles
  for delete to authenticated using (id = auth.uid());

-- workspaces -------------------------------------------------
create policy workspaces_select_members on public.workspaces
  for select to authenticated using (public.is_workspace_member(id));

create policy workspaces_insert_any on public.workspaces
  for insert to authenticated with check (true);

create policy workspaces_update_owner on public.workspaces
  for update to authenticated
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

create policy workspaces_delete_owner on public.workspaces
  for delete to authenticated using (public.is_workspace_owner(id));

-- workspace_members ------------------------------------------
create policy members_select_same_workspace on public.workspace_members
  for select to authenticated using (public.is_workspace_member(workspace_id));

create policy members_insert_owner on public.workspace_members
  for insert to authenticated
  with check (public.is_workspace_owner(workspace_id));

create policy members_update_owner on public.workspace_members
  for update to authenticated
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

create policy members_delete_owner_or_self on public.workspace_members
  for delete to authenticated
  using (
    public.is_workspace_owner(workspace_id)
    or user_id = auth.uid()
  );

-- projects ---------------------------------------------------
create policy projects_select_members on public.projects
  for select to authenticated using (public.is_workspace_member(workspace_id));

create policy projects_insert_members on public.projects
  for insert to authenticated with check (public.is_workspace_member(workspace_id));

create policy projects_update_members on public.projects
  for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy projects_delete_owners on public.projects
  for delete to authenticated using (public.is_workspace_owner(workspace_id));

-- tasks ------------------------------------------------------
-- Membership is one hop through projects. The composite index on
-- projects(id, workspace_id) keeps the subquery cheap.
create policy tasks_select_members on public.tasks
  for select to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy tasks_insert_members on public.tasks
  for insert to authenticated with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy tasks_update_members on public.tasks
  for update to authenticated
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.is_workspace_member(p.workspace_id)
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

create policy tasks_delete_members on public.tasks
  for delete to authenticated using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and public.is_workspace_member(p.workspace_id)
    )
  );

-- ============================================================
-- Grants — RLS is moot without these.
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.profiles to anon;
grant usage, select on all sequences in schema public to authenticated;

-- ============================================================
-- Realtime
-- ============================================================
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.projects;
alter publication supabase_realtime add table public.workspaces;
alter publication supabase_realtime add table public.workspace_members;

-- ============================================================
-- Seed data
--
-- Two demo accounts, both with password "demo1234":
--   demo@aspio.dev  (owns Aspio Studio,  member of Wright Co.)
--   alex@aspio.dev  (owns Wright Co.,    member of Aspio Studio)
-- 4 projects, 16 tasks spread across statuses, assignees, and due dates
-- (some overdue, to exercise the /overdue-tasks edge function).
-- ============================================================

-- Auth users. Direct insert into auth.* — works in Supabase because the
-- SQL editor runs as the postgres superuser.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
(
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'demo@aspio.dev',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Demo Owner"}',
  now(), now(), '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated',
  'alex@aspio.dev',
  crypt('demo1234', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Alex Wright"}',
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values
(
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  jsonb_build_object(
    'sub', '11111111-1111-1111-1111-111111111111',
    'email', 'demo@aspio.dev',
    'email_verified', true
  ),
  'email', now(), now(), now()
),
(
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  jsonb_build_object(
    'sub', '22222222-2222-2222-2222-222222222222',
    'email', 'alex@aspio.dev',
    'email_verified', true
  ),
  'email', now(), now(), now()
);

-- Workspaces, projects, members.
insert into public.workspaces (id, name) values
  ('a1111111-1111-1111-1111-111111111111', 'Aspio Studio'),
  ('a2222222-2222-2222-2222-222222222222', 'Wright Co.');

insert into public.workspace_members (workspace_id, user_id, role) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'owner'),
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'member'),
  ('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'owner'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'member');

insert into public.projects (id, workspace_id, name) values
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Onboarding Revamp'),
  ('b1111111-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Marketing Site'),
  ('b2222222-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'Q3 Roadmap'),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Customer Research');

-- Tasks. Mix of statuses, assignees, and due dates (some overdue).
insert into public.tasks (project_id, title, description, status, assignee_id, due_date) values
  -- Onboarding Revamp
  ('b1111111-1111-1111-1111-111111111111', 'Draft new sign-up flow',         'Map every screen from landing through verification.', 'todo',        '11111111-1111-1111-1111-111111111111', current_date + 3),
  ('b1111111-1111-1111-1111-111111111111', 'Wireframe welcome screen',       'Three variants; A/B candidate.',                      'in_progress', '22222222-2222-2222-2222-222222222222', current_date + 1),
  ('b1111111-1111-1111-1111-111111111111', 'Implement password rules',       'Match the security review checklist.',                'done',        '11111111-1111-1111-1111-111111111111', current_date - 2),
  ('b1111111-1111-1111-1111-111111111111', 'Audit drop-off funnel',          'Mixpanel + Hotjar comparison.',                       'todo',        '22222222-2222-2222-2222-222222222222', current_date + 7),

  -- Marketing Site
  ('b1111111-2222-2222-2222-222222222222', 'Rewrite hero copy',              'Sharper benefit framing; shorter.',                   'in_progress', '11111111-1111-1111-1111-111111111111', current_date + 1),
  ('b1111111-2222-2222-2222-222222222222', 'Replace placeholder screenshots', 'Need production captures from staging.',             'todo',        '22222222-2222-2222-2222-222222222222', current_date + 4),
  ('b1111111-2222-2222-2222-222222222222', 'Optimize Largest Contentful Paint', 'Image priority + font preconnect.',                'todo',        '22222222-2222-2222-2222-222222222222', current_date - 1),
  ('b1111111-2222-2222-2222-222222222222', 'Launch redesign',                'Coordinate with comms.',                              'done',        '11111111-1111-1111-1111-111111111111', current_date - 1),

  -- Q3 Roadmap
  ('b2222222-1111-1111-1111-111111111111', 'Lock scope with eng leads',      'Final cuts before kickoff.',                          'todo',        '22222222-2222-2222-2222-222222222222', current_date + 2),
  ('b2222222-1111-1111-1111-111111111111', 'Risk review',                    'Identify top 3 unknowns per workstream.',             'in_progress', '11111111-1111-1111-1111-111111111111', current_date + 1),
  ('b2222222-1111-1111-1111-111111111111', 'Publish to internal wiki',       'Single page; include owners.',                        'done',        '11111111-1111-1111-1111-111111111111', current_date - 3),
  ('b2222222-1111-1111-1111-111111111111', 'Sync to Notion',                 'Bi-directional, not just export.',                    'todo',        '22222222-2222-2222-2222-222222222222', current_date - 1),

  -- Customer Research
  ('b2222222-2222-2222-2222-222222222222', 'Recruit 8 interview participants', 'Mix of new + churned.',                             'in_progress', '22222222-2222-2222-2222-222222222222', current_date + 6),
  ('b2222222-2222-2222-2222-222222222222', 'Draft interview guide',          'Tied to Q3 hypothesis doc.',                          'todo',        '11111111-1111-1111-1111-111111111111', current_date + 1),
  ('b2222222-2222-2222-2222-222222222222', 'Analyze previous round findings', 'Tag themes; flag outliers.',                          'done',        '11111111-1111-1111-1111-111111111111', current_date - 4),
  ('b2222222-2222-2222-2222-222222222222', 'Schedule synthesis workshop',    'Half day, max 6 people.',                             'todo',        '22222222-2222-2222-2222-222222222222', current_date - 2);
