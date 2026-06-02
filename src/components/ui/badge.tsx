import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none tabular-nums whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral:
          "border-border bg-muted text-muted-foreground",
        primary:
          "border-transparent bg-accent text-accent-foreground",
        success:
          "border-transparent bg-[color:var(--color-status-done-bg)] text-[color:var(--color-status-done-fg)]",
        warning:
          "border-transparent bg-[color:var(--color-status-progress-bg)] text-[color:var(--color-status-progress-fg)]",
        danger:
          "border-transparent bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps): React.ReactElement {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
