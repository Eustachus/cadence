import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="hidden w-60 border-r md:block">
        <div className="p-4">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="space-y-2 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
      {/* Main content skeleton */}
      <div className="flex-1">
        <div className="border-b p-4">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="p-6">
          <Skeleton className="mb-4 h-10 w-64" />
          <Skeleton className="mb-2 h-4 w-96" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
