export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-10 w-64 rounded-lg skeleton-b2b dark:opacity-80" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[120px] min-h-[120px] rounded-xl skeleton-b2b dark:opacity-80" />
          ))}
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-72 rounded-xl skeleton-b2b dark:opacity-80" />
          <div className="h-72 rounded-xl skeleton-b2b dark:opacity-80" />
      </div>
    </div>
  );
}
