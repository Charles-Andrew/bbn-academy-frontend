import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({
  className,
  count = 1,
}: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => `skeleton-${i + 1}`).map(
        (skeletonId) => (
          <div
            key={skeletonId}
            className={cn("animate-pulse rounded-md bg-muted", className)}
          />
        ),
      )}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <LoadingSkeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <LoadingSkeleton className="h-4 w-3/4" />
          <LoadingSkeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-3 w-full" />
        <LoadingSkeleton className="h-3 w-5/6" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-8 w-8 rounded-md" />
      </div>
      <div className="space-y-2">
        <LoadingSkeleton className="h-8 w-16" />
        <LoadingSkeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function BookCardSkeleton() {
  return (
    <div className="group relative bg-card rounded-lg border p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <LoadingSkeleton className="aspect-[16/9] bg-muted rounded-md mb-4" />
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <LoadingSkeleton className="h-4 w-16" />
          <LoadingSkeleton className="h-6 w-12" />
        </div>
        <LoadingSkeleton className="h-5 w-3/4" />
        <LoadingSkeleton className="h-4 w-full" />
        <LoadingSkeleton className="h-4 w-5/6" />
        <LoadingSkeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
