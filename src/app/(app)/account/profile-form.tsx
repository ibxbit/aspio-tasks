"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = {};

type Props = {
  initialDisplayName: string;
  initialAvatarUrl: string;
};

export function ProfileForm({
  initialDisplayName,
  initialAvatarUrl,
}: Props): React.ReactElement {
  const [state, formAction, isPending] = useActionState(
    updateProfile,
    initialState,
  );

  useEffect(() => {
    if (state.ok) toast.success("Profile saved.");
    else if (state.formError) toast.error(state.formError);
  }, [state.ok, state.formError]);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={initialDisplayName}
          maxLength={80}
          required
          aria-invalid={state.fieldErrors?.displayName ? true : undefined}
        />
        {state.fieldErrors?.displayName ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.displayName}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatarUrl">Avatar URL</Label>
        <Input
          id="avatarUrl"
          name="avatarUrl"
          type="url"
          defaultValue={initialAvatarUrl}
          placeholder="https://…"
          maxLength={2048}
          aria-invalid={state.fieldErrors?.avatarUrl ? true : undefined}
        />
        {state.fieldErrors?.avatarUrl ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.avatarUrl}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Paste a URL to an image. Leave blank to use initials.
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
