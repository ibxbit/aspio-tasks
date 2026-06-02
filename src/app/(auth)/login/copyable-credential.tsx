"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

export function CopyableCredential({
  value,
}: {
  value: string;
}): React.ReactElement {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`Copied ${value}`);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Click to copy ${value}`}
      aria-label={`Copy ${value} to clipboard`}
      className="group inline-flex items-baseline gap-1 font-mono text-foreground/80 underline-offset-2 hover:text-foreground hover:underline focus-ring dark:text-white/80 dark:hover:text-white"
    >
      <span>{value}</span>
      {copied ? (
        <Check className="h-3 w-3 translate-y-0.5 text-emerald-600 dark:text-emerald-300" />
      ) : (
        <Copy className="h-3 w-3 translate-y-0.5 text-muted-foreground/60 transition-colors group-hover:text-foreground/70 dark:text-white/35 dark:group-hover:text-white/70" />
      )}
    </button>
  );
}
