
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6 lg:p-8">
      <Skeleton className="h-12 w-1/3 rounded-lg" />
      <div className="space-y-4">
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
