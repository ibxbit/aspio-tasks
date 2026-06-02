"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
};

/**
 * Shows the avatar image if `src` is set, otherwise renders the user's
 * initials on the accent surface. Falls back to initials silently if
 * the image fails to load (e.g. a 403 from a moved file).
 */
export function Avatar({
  name,
  src,
  size = 28,
  className,
}: Props): React.ReactElement {
  const [errored, setErrored] = React.useState(false);
  const showImage = typeof src === "string" && src.length > 0 && !errored;

  return (
    <span
      aria-hidden
      style={{ width: size, height: size }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-accent text-[10px] font-semibold text-accent-foreground",
        className,
      )}
    >
      {showImage ? (
        // Avatar URLs are user-provided; using a plain <img> avoids tying
        // arbitrary domains to next.config remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        <span>{initialsFor(name)}</span>
      )}
    </span>
  );
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase() || "?";
}
