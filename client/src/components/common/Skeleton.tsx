export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-800/60 ${className}`}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 border border-slate-800/80 bg-slate-900/40 flex flex-col gap-3">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between items-center mt-2">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-8 w-1/4 rounded-lg" />
      </div>
    </div>
  );
}
