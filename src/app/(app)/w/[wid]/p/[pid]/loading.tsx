import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading(): React.ReactElement {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-64" />
      </header>

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-7 w-28 ml-2" />
        </div>

        <Skeleton className="h-9 w-full" />

        <div className="overflow-hidden rounded-lg border border-border bg-surface divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 flex-1" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-5 w-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
