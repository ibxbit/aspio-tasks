"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onCreate: (title: string) => Promise<void>;
};

export function CreateTaskInline({ onCreate }: Props): React.ReactElement {
  const [title, setTitle] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const submit = (): void => {
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    // Clear the field immediately — the parent applies an optimistic row.
    setTitle("");
    startTransition(async () => {
      await onCreate(trimmed);
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="relative"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
      </span>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task — press Enter to add"
        maxLength={200}
        className="pl-9 pr-24"
      />
      <Button
        type="submit"
        size="sm"
        variant={title.trim() ? "primary" : "ghost"}
        disabled={isPending || title.trim().length === 0}
        className="absolute right-1 top-1/2 h-7 -translate-y-1/2"
      >
        {isPending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
