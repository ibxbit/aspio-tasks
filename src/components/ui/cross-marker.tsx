import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Small `+` glyph used to mark intersections of horizontal and vertical
 * accent lines. Pure decoration; positioned by the caller via className.
 */
export function CrossMarker({
  className,
}: {
  className?: string;
}): React.ReactElement {
  return (
    <Plus
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-3.5 w-3.5 text-muted-foreground/70",
        className,
      )}
    />
  );
}
