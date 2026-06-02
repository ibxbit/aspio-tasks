"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject, type MutationState } from "../../actions";

const initialState: MutationState = {};

type Props = { workspaceId: string };

export function CreateProjectForm({ workspaceId }: Props): React.ReactElement {
  const action = createProject.bind(null, workspaceId);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-2" noValidate>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </span>
          <Input
            name="name"
            placeholder="New project name"
            className="pl-8"
            required
            maxLength={80}
            aria-invalid={state.fieldErrors?.name ? true : undefined}
          />
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Add"}
        </Button>
      </div>

      {state.fieldErrors?.name ? (
        <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
      ) : null}
      {state.formError ? (
        <p className="text-xs text-destructive">{state.formError}</p>
      ) : null}
    </form>
  );
}
