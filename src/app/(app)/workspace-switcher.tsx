"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type WorkspaceSummary = {
  id: string;
  name: string;
  role: "owner" | "member";
};

type Props = {
  workspaces: WorkspaceSummary[];
};

export function WorkspaceSwitcher({ workspaces }: Props): React.ReactElement {
  const pathname = usePathname();
  const match = pathname.match(/^\/w\/([^/]+)/);
  const currentId = match?.[1] ?? null;
  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex w-full max-w-full items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted focus-ring sm:w-auto"
        aria-label="Switch workspace"
      >
        <span className="min-w-0 truncate sm:max-w-[12rem]">
          {current?.name ?? "Workspaces"}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[14rem]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((ws) => {
          const isCurrent = ws.id === current?.id;
          return (
            <DropdownMenuItem key={ws.id} asChild>
              <Link
                href={`/w/${ws.id}`}
                className="flex w-full items-center justify-between gap-2"
              >
                <span className="flex flex-col">
                  <span className="truncate">{ws.name}</span>
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {ws.role}
                  </span>
                </span>
                {isCurrent ? (
                  <Check className="h-3.5 w-3.5 text-primary" aria-label="Current" />
                ) : null}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/workspaces/new" className="flex w-full items-center gap-2">
            <Plus className="h-3.5 w-3.5" />
            New workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
