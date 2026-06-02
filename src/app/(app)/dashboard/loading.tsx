import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading(): React.ReactElement {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-16">
      <Skeleton className="h-12 w-12 rounded-xl" />
      <div className="w-full space-y-2 text-center">
        <Skeleton className="mx-auto h-5 w-48" />
        <Skeleton className="mx-auto h-3 w-64" />
      </div>
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
