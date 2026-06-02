"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";

const initialState: AuthState = {};

type Props = { next?: string };

export function SignUpForm({ next }: Props): React.ReactElement {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <Field
        id="display_name"
        label="Name"
        autoComplete="name"
        required
        error={state.fieldErrors?.display_name}
      />
      <Field
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        error={state.fieldErrors?.email}
      />
      <Field
        id="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        error={state.fieldErrors?.password}
        hint="8 characters or more."
      />

      {state.formError ? (
        <p
          role="alert"
          className="border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200"
        >
          {state.formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 flex h-11 w-full items-center justify-center bg-foreground text-[13px] font-semibold uppercase tracking-[0.18em] text-background transition-[background-color,transform] hover:bg-foreground/90 active:scale-[0.99] disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-white/90"
      >
        {isPending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};

function Field({
  id,
  label,
  error,
  hint,
  ...inputProps
}: FieldProps): React.ReactElement {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground dark:text-white/55"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="block h-10 w-full border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-ring focus:outline-none dark:border-white/15 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/40 dark:focus:bg-white/[0.06]"
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[11px] text-destructive dark:text-red-200">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-muted-foreground dark:text-white/40">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
