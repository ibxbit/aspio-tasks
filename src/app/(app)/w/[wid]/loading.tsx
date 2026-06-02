import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceLoading(): React.ReactElement {
  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-56" />
      </header>

      <section className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-full" />

        <ul className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <li
              key={i}
              className="rounded-lg border border-border bg-surface p-4 shadow-xs"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
