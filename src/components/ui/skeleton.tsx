import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return (
    <div
      aria-hidden
      className={cn(
        "rounded-md bg-muted relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:-translate-x-full before:animate-[shimmer_1.6s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent",
        "motion-reduce:before:hidden",
        className,
      )}
      {...props}
    />
  );
}
