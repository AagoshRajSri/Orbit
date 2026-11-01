/**
 * FeedSkeleton.tsx — Suspense fallback for FeedClientUI
 *
 * Shown while the React Server Component is streaming and FeedClientUI
 * hasn't hydrated yet. Uses CSS animation (no JS), so it renders even
 * before any JavaScript loads.
 */

export default function FeedSkeleton() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Fake top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0">
        <div className="flex-1 h-9 rounded-xl bg-white/4 animate-pulse" />
        <div className="h-9 w-20 rounded-xl bg-violet-500/10 animate-pulse" />
      </div>

      {/* Fake post cards */}
      <div className="flex-1 px-4 py-4 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/8 bg-white/4 p-4 flex gap-3 animate-pulse"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Vote column skeleton */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="size-6 rounded bg-white/8" />
              <div className="w-6 h-3 rounded bg-white/6" />
              <div className="size-6 rounded bg-white/8" />
            </div>
            {/* Content skeleton */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="size-4 rounded-full bg-violet-500/20" />
                <div className="h-2.5 w-20 rounded bg-white/8" />
              </div>
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-full rounded bg-white/6" />
              <div className="h-3 w-2/3 rounded bg-white/6" />
              <div className="h-px w-full bg-white/5 mt-2" />
              <div className="flex gap-4">
                <div className="h-3 w-20 rounded bg-white/8" />
                <div className="h-3 w-16 rounded bg-orange-500/10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
