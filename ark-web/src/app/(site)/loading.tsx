/** Instant skeleton shown while a page's data loads during navigation. */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="hero-bg">
        <div className="container-page pb-14 pt-32 sm:pb-20 sm:pt-40">
          <div className="skeleton-dark h-3 w-32 rounded-full" />
          <div className="skeleton-dark mt-6 h-10 w-full max-w-2xl rounded-xl sm:h-14" />
          <div className="skeleton-dark mt-4 h-10 w-3/4 max-w-xl rounded-xl sm:h-14" />
          <div className="skeleton-dark mt-8 h-4 w-full max-w-lg rounded-full" />
        </div>
      </div>
      <div className="container-page grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-line">
            <div className="skeleton aspect-[16/10]" />
            <div className="space-y-3 p-6">
              <div className="skeleton h-3 w-24 rounded-full" />
              <div className="skeleton h-5 w-3/4 rounded-lg" />
              <div className="skeleton h-3 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
