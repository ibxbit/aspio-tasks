# Aspio Tasks

Multi-workspace task management. Built for the Aspio fullstack take-home.

- **Live URL** — <https://aspio-tasks.vercel.app>
- **GitHub** — <https://github.com/ibxbit/aspio-tasks>
- **Start time** — 2026-06-02, ~12:42 EAT (UTC+3)
- **End time** — 2026-06-02, ~23:55 EAT (UTC+3)

## Demo accounts

`schema.sql` seeds two accounts so the UI is populated immediately. Password for both is `demo1234`. On the login page they're clickable and copy to clipboard.

| Email            | Owns         | Member of    |
| ---------------- | ------------ | ------------ |
| `demo@aspio.dev` | Aspio Studio | Wright Co.   |
| `alex@aspio.dev` | Wright Co.   | Aspio Studio |

> If the demo accounts can't sign in on a fresh Supabase project, check **Authentication → Providers → Email** and turn **"Confirm email"** off. The seed sets `email_confirmed_at`, but the project-wide setting still needs to allow non-confirmed sign-ins.

## Run locally

```bash
pnpm install                                              # 1. deps
cp .env.example .env.local                                # 2. paste Supabase URL + anon key
# Then run schema.sql in the Supabase SQL editor          # 3. schema, RLS, seed
supabase link --project-ref <YOUR_REF> && pnpm db:types   # 4. typed client
pnpm dev                                                  # 5. http://localhost:3000
```

For the Edge Function: `supabase functions deploy overdue-tasks` (one-time).

## Stack

| Layer         | Tech                                                  |
| ------------- | ----------------------------------------------------- |
| Framework     | Next.js 16 (App Router, Server Components, RSC)       |
| Language      | TypeScript (strict, **zero `any`**)                   |
| Styling       | Tailwind CSS v4 with custom OKLCH design tokens       |
| UI primitives | Hand-rolled on Radix UI; 3D beams via `@react-three/fiber` |
| Theming       | `next-themes` with View Transitions API circle-reveal |
| Fonts         | Geist Variable + Geist Mono via `next/font/local`     |
| Backend       | Supabase (Postgres, Auth, Realtime, Edge Functions)   |
| Data fetching | Server Components + `router.refresh()`; **no `useEffect` for data fetching** |
| Mutations     | React Server Actions + optimistic UI with rollback    |
| Deployment    | Vercel                                                |

## What's complete and working

Every assignment requirement is implemented. The eight numbered requirements map as follows:

| Req. | Status | Notes |
| ---- | ------ | ----- |
| **R1 — Schema + RLS** | ✅ | `schema.sql` runs in one execution. RLS is enabled on every table with SELECT/INSERT/UPDATE/DELETE policies; cross-workspace isolation is enforced via `workspace_members` through helper functions `is_workspace_member` / `is_workspace_owner` (SECURITY DEFINER to avoid policy recursion). |
| **R2 — Generated types** | ✅ | `pnpm db:types` runs `supabase gen types typescript --linked > src/types/database.ts`. The typed client is used across the app; PostgREST `select()` results are narrowed with `.returns<T>()` rather than `any` casts. |
| **R3 — Realtime** | ✅ | `useRealtimeTasks` subscribes to `tasks` Postgres changes filtered by `project_id`. The supabase realtime socket auth token is set explicitly before subscribing (the SSR browser client doesn't wire it in automatically). Channel teardown happens on unmount. |
| **R4 — Filters in URL** | ✅ | `?status=todo,in_progress&assignee=<uid>` survives sharing and reload. Filter UI in `task-filters.tsx`, URL sync via `router.replace`. |
| **R5 — Inline editing** | ✅ | Title (double-click), status pill (dropdown), assignee (dropdown), due date (native picker). No edit modal. Detail side-sheet handles description + delete; every field saves on blur. |
| **R6 — Loading / empty / error** | ✅ | Per-route `loading.tsx` skeletons, dashed-border empty states with CTAs, `error.tsx` boundaries, `not-found.tsx` pages. |
| **R7 — Optimistic UI** | ✅ | `updateTask`, `createTask`, `deleteTask` apply locally first, then call the server action. On either a returned error _or_ a thrown exception (network failure), the previous snapshot is restored and a Sonner toast surfaces the cause. |
| **R8 — Edge Function** | ✅ | `supabase/functions/overdue-tasks` accepts `{ project_id }` POST, queries tasks with `due_date < today AND status != 'done'`, joins assignee names. Uses the caller's JWT so RLS still applies (a user can't query a project they don't belong to). Triggered from the **Overdue tasks** button on the project view; results render in a side sheet. |

**Required screens** — Auth (sign in / sign up / sign out), Workspace dashboard with project status counts, Project view with inline editing and filters, Task detail side panel.

## What is incomplete, skipped, or has known issues

I'd rather flag these openly than have them found in review:

1. **Workspace and project create + task delete go through `SECURITY DEFINER` RPCs (`rpc_create_workspace`, `rpc_create_project`, `rpc_delete_task`).** This is deliberate: each RPC owns its own auth + workspace-membership check, so the path that mutates state and the path that decides who is allowed to mutate it live in one place. UPDATE and SELECT still go through normal RLS policies. The first time I went down this road I was working around a Supabase quirk where INSERTs into `workspaces` were being rejected despite the policy reading `WITH CHECK (true)`; the RPC pattern made the intent explicit, so I kept it.

2. **Sign-up requires email confirmation to be turned OFF** in the Supabase Auth dashboard. The seed accounts work because `email_confirmed_at` is set explicitly, but new signups land on a `data.session === null` state if confirmation is required. Documented at the top of this README — it's an external config note, not a code gap.

3. **`src/components/ui/login.tsx`** is a vendored Three.js beams hero with 4 unused imports (`ArrowRight`, `GitBranch`, `Star`, `Button`). These trigger ESLint warnings (not errors) and are left as-is to avoid editing the upstream component.

4. **The light theme is functional but the auth pages stay dark** regardless of theme — the 3D beams background is always black, and overlaying light-themed content on top would clash. Dark is the default theme on first load. Post-auth screens respect the toggle.

Resolved in the latest pass:

- **Leave workspace** — `/w/[wid]` now has a "Leave workspace" action for members and non-last owners. The last owner is blocked with an inline message that they need to promote another member or delete the workspace. The DELETE goes through the existing `members_delete_owner_or_self` RLS policy, not an RPC.
- **Avatars** — `profiles.avatar_url` is rendered everywhere we previously showed initials (header pip, assignee dropdown trigger and items, task detail sheet). `/account` lets the user edit their display name and avatar URL; missing/broken images fall back to initials silently.
- **Live dashboard counts** — `/w/[wid]` subscribes to `projects` (workspace-scoped) and `tasks` (filtered client-side by project id, since realtime postgres_changes doesn't reliably support the `in` operator). On any matching change it calls `router.refresh()`, so per-project status counts update without navigation.

## Architectural decisions worth defending (or reconsidering)

- **Server Components for all initial reads.** No `useEffect`-for-data anywhere. Mutations go through Server Actions; live updates come from Supabase Realtime. The only client-side data fetch is the Edge Function trigger (`supabase.functions.invoke`).

- **Optimistic state lives in one place.** The `ProjectView` client component owns the task list state. `useRealtimeTasks` merges remote events in, and three optimistic helpers (`updateTask`, `createTask`, `deleteTask`) apply changes locally then call the server action. A `tasksRef` mirrors state so the helpers always read the current list without re-running their `useMemo`. The single-owner model avoids the "what wins, realtime or local?" tug-of-war that's common with optimistic UI.

- **SSR Supabase client via `@supabase/ssr` `createServerClient`**, not the deprecated `createClient` from `@supabase/supabase-js` in components. The Next 16 `proxy.ts` (renamed from `middleware.ts`) handles session refresh and auth-gated redirects.

- **Design system.** Sharp corners, mono font in the post-auth UI, fixed grid frame with `+` markers at every line intersection. Light / dark via `next-themes` with the View Transitions API for the circle-reveal animation. Tokens (`--background`, `--foreground`, `--card`, ...) are theme-aware; legacy aliases (`--color-surface`, `--color-status-*`) sit on top so existing components didn't have to be rewritten when the palette flipped.

- **What I'd change with more time.** Move the create/delete RPCs back to plain PostgREST once the RLS quirk is understood (or move all mutations behind RPCs uniformly so the pattern is consistent). Add a `useRealtimeProjects` subscription on the workspace dashboard so task counts update live. Polish the light theme on the auth pages by replacing the 3D beams with a paper-grain background when the theme is light.

## Project layout

```
src/
  app/
    (auth)/           login / signup pages — split-screen with 3D beams
    (app)/            authed routes — dashboard, /w/[wid], /w/[wid]/p/[pid]
    fonts/            GeistVF.woff2 + GeistMonoVF.woff2 (variable)
  components/
    ui/               primitives — button, input, dropdown, sheet, cross-marker, …
    svgs/             Sun, Moon icons used by the animated theme toggle
    theme-provider.tsx
  lib/
    supabase/         server.ts, client.ts, proxy.ts (SSR pattern)
    realtime/         useRealtimeTasks hook
    data/             cached server queries
    utils.ts, env.ts
  types/
    database.ts       regenerated by `pnpm db:types`
supabase/
  functions/
    overdue-tasks/    Deno edge function
schema.sql            tables + RLS + RPC funcs + triggers + seed
proxy.ts              Next 16 proxy (was middleware) — session refresh + redirects
```

## Scripts

| Script           | Purpose                            |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Next.js dev server                 |
| `pnpm build`     | Production build                   |
| `pnpm start`     | Serve a production build           |
| `pnpm lint`      | ESLint                             |
| `pnpm typecheck` | `tsc --noEmit`                     |
| `pnpm db:types`  | Regenerate `src/types/database.ts` |
