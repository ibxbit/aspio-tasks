"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTask } from "./actions";

type Props = {
  projectId: string;
  workspaceId: string;
  onError: (msg: string) => void;
};

export function CreateTaskInline({
  projectId,
  workspaceId,
  onError,
}: Props): React.ReactElement {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const submit = (): void => {
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    startTransition(async () => {
      const res = await createTask({ projectId, workspaceId, title: trimmed });
      if (!res.ok) {
        onError(res.error);
        return;
      }
      setTitle("");
      router.refresh();
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
