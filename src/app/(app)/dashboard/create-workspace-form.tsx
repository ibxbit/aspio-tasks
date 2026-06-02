"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkspace, type MutationState } from "../actions";

const initialState: MutationState = {};

export function CreateWorkspaceForm(): React.ReactElement {
  const [state, formAction, isPending] = useActionState(
    createWorkspace,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3 text-left" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Marketing"
          required
          maxLength={80}
          autoFocus
          aria-invalid={state.fieldErrors?.name ? true : undefined}
          aria-describedby={state.fieldErrors?.name ? "name-error" : undefined}
        />
        {state.fieldErrors?.name ? (
          <p id="name-error" className="text-xs text-destructive">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      {state.formError ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {state.formError}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? "Creating…" : "Create workspace"}
      </Button>
    </form>
  );
}
