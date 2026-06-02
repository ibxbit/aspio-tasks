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
          className="border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200"
        >
          {state.formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 flex h-11 w-full items-center justify-center bg-white text-[13px] font-semibold uppercase tracking-[0.18em] text-black transition-[background-color,transform] hover:bg-white/90 active:scale-[0.99] disabled:opacity-60"
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
        className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="block h-10 w-full border border-white/15 bg-white/[0.03] px-3 text-sm text-white placeholder:text-white/30 transition-colors focus:border-white/40 focus:bg-white/[0.06] focus:outline-none"
        {...inputProps}
      />
      {error ? (
        <p id={`${id}-error`} className="text-[11px] text-red-200">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[11px] text-white/40">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
