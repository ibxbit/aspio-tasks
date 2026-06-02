"use client";

import * as React from "react";
import * as Dm from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Dm.Root;
export const DropdownMenuTrigger = Dm.Trigger;
export const DropdownMenuGroup = Dm.Group;
export const DropdownMenuPortal = Dm.Portal;
export const DropdownMenuSub = Dm.Sub;
export const DropdownMenuRadioGroup = Dm.RadioGroup;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Dm.Content>,
  React.ComponentPropsWithoutRef<typeof Dm.Content>
>(function DropdownMenuContent(
  { className, sideOffset = 6, align = "start", ...props },
  ref,
) {
  return (
    <Dm.Portal>
      <Dm.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-md",
          "data-[state=open]:animate-[pop_160ms_cubic-bezier(0.34,1.56,0.64,1)]",
          "data-[state=closed]:animate-[fade-in_120ms_ease-out_reverse]",
          className,
        )}
        {...props}
      />
    </Dm.Portal>
  );
});

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Dm.Item>,
  React.ComponentPropsWithoutRef<typeof Dm.Item> & { inset?: boolean }
>(function DropdownMenuItem({ className, inset, ...props }, ref) {
  return (
    <Dm.Item
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-sm",
        "outline-none transition-colors",
        "focus:bg-muted focus:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Dm.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof Dm.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, ...props }, ref) {
  return (
    <Dm.CheckboxItem
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-md py-1.5 pl-8 pr-2.5 text-sm",
        "outline-none focus:bg-muted",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <Dm.ItemIndicator>
          <Check className="h-3.5 w-3.5" />
        </Dm.ItemIndicator>
      </span>
      {children}
    </Dm.CheckboxItem>
  );
});

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof Dm.Label>,
  React.ComponentPropsWithoutRef<typeof Dm.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <Dm.Label
      ref={ref}
      className={cn(
        "px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
});

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Dm.Separator>,
  React.ComponentPropsWithoutRef<typeof Dm.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <Dm.Separator
      ref={ref}
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
});

export const DropdownMenuShortcut: React.FC<
  React.HTMLAttributes<HTMLSpanElement>
> = ({ className, ...props }) => (
  <span
    className={cn(
      "ml-auto text-[11px] tracking-wider text-muted-foreground tabular-nums",
      className,
    )}
    {...props}
  />
);

export const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof Dm.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof Dm.SubTrigger>
>(function DropdownMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <Dm.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none",
        "focus:bg-muted data-[state=open]:bg-muted",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-3.5 w-3.5" />
    </Dm.SubTrigger>
  );
});

export const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof Dm.SubContent>,
  React.ComponentPropsWithoutRef<typeof Dm.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
  return (
    <Dm.SubContent
      ref={ref}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-surface p-1 shadow-md",
        className,
      )}
      {...props}
    />
  );
});
