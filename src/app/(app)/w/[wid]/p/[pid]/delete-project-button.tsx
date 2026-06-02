"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/app/(app)/actions";

type Props = {
  workspaceId: string;
  projectId: string;
  projectName: string;
};

export function DeleteProjectButton({
  workspaceId,
  projectId,
  projectName,
}: Props): React.ReactElement {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Delete project
      </Button>
    );
  }

  const handleConfirm = (): void => {
    startTransition(async () => {
      const res = await deleteProject(workspaceId, projectId);
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      toast.success(`Deleted ${projectName}.`);
      router.push(`/w/${workspaceId}`);
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Delete {projectName}?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending ? "Deleting…" : "Confirm"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(false)}
        disabled={isPending}
      >
        Cancel
      </Button>
    </div>
  );
}
