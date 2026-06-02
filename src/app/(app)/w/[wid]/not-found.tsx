import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WorkspaceNotFound(): React.ReactElement {
  return (
    <div className="mx-auto max-w-md space-y-4 pt-16 text-center">
      <h2 className="text-lg font-semibold">Workspace not found.</h2>
      <p className="text-sm text-muted-foreground">
        It may have been deleted, or you might not have access.
      </p>
      <Button variant="outline" asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
