"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { DoorOpen } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { leaveWorkspace } from "../../actions";

type Props = {
  workspaceId: string;
  workspaceName: string;
  myRole: "owner" | "member";
  isLastOwner: boolean;
};

export function LeaveWorkspaceButton({
  workspaceId,
  workspaceName,
  myRole,
  isLastOwner,
}: Props): React.ReactElement {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  if (isLastOwner) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground"
        title="You are the last owner. Promote another member to owner first, or delete the workspace."
      >
        <DoorOpen className="h-3.5 w-3.5" />
        Last owner — cannot leave
      </span>
    );
  }

  if (!confirming) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setConfirming(true)}
      >
        <DoorOpen className="h-3.5 w-3.5" />
        {myRole === "owner" ? "Leave (owner)" : "Leave workspace"}
      </Button>
    );
  }

  const handleConfirm = (): void => {
    startTransition(async () => {
      const res = await leaveWorkspace(workspaceId);
      if (!res.ok) {
        toast.error(res.error);
        setConfirming(false);
        return;
      }
      toast.success(`Left ${workspaceName}.`);
      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Leave {workspaceName}?</span>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending ? "Leaving…" : "Confirm"}
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
