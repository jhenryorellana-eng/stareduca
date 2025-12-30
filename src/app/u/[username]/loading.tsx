export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header skeleton */}
      <header className="border-b border-slate-700/50 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="h-8 w-32 bg-slate-700 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-slate-700 rounded animate-pulse" />
        </div>
      </header>

      {/* Profile Content skeleton */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-slate-700 animate-pulse" />

          {/* Profile info */}
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="-mt-16 mb-4">
              <div className="h-32 w-32 rounded-2xl bg-slate-700 border-4 border-slate-800 animate-pulse" />
            </div>

            {/* Name */}
            <div className="mb-6">
              <div className="h-8 w-48 bg-slate-700 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-32 bg-slate-700 rounded animate-pulse" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="h-3 w-16 bg-slate-700 rounded animate-pulse mb-2" />
                  <div className="h-6 w-12 bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Code */}
            <div className="bg-slate-700/30 rounded-xl p-6 mb-6 animate-pulse">
              <div className="h-4 w-32 bg-slate-600 rounded mb-2" />
              <div className="h-8 w-40 bg-slate-600 rounded" />
            </div>

            {/* Link */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
              <div className="h-5 w-32 bg-slate-700 rounded animate-pulse mb-3" />
              <div className="h-12 bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
