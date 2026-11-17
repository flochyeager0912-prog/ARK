/** Instant skeleton shown while a page's data loads during navigation. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="container-page pb-5 pt-24 sm:pt-32">
        <div className="panel max-w-3xl p-7 sm:p-10 lg:p-12">
          <div className="skeleton-dark h-3 w-32 rounded-full" />
          <div className="skeleton-dark mt-6 h-10 w-full max-w-2xl rounded-xl sm:h-14" />
          <div className="skeleton-dark mt-4 h-10 w-3/4 max-w-xl rounded-xl sm:h-14" />
          <div className="skeleton-dark mt-8 h-4 w-full max-w-lg rounded-full" />
        </div>
      </div>
      <div className="container-page py-5">
        <div className="panel grid gap-4 p-6 sm:grid-cols-2 sm:p-10 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10">
              <div className="skeleton-dark aspect-[16/10]" />
              <div className="space-y-3 p-6">
                <div className="skeleton-dark h-3 w-24 rounded-full" />
                <div className="skeleton-dark h-5 w-3/4 rounded-lg" />
                <div className="skeleton-dark h-3 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
