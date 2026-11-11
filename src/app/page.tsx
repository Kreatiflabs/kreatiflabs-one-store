import Link from "next/link";
import { executeQuery, initDatabase, type AppModel, type ReleaseModel } from "@/lib/db";
import { Smartphone, Apple, Download, Sparkles, Layers, ShieldCheck, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await initDatabase();

  const apps = await executeQuery<AppModel>(
    "SELECT * FROM apps WHERE is_published = 1 ORDER BY updated_at DESC"
  );

  const releases = await executeQuery<ReleaseModel>(
    "SELECT * FROM releases WHERE status = 'published' ORDER BY build_number DESC"
  );

  // Group latest release per platform per app
  const appReleasesMap: Record<string, { android?: ReleaseModel; ios?: ReleaseModel }> = {};
  for (const rel of releases) {
    if (!appReleasesMap[rel.app_slug]) {
      appReleasesMap[rel.app_slug] = {};
    }
    if (rel.platform === "android" && !appReleasesMap[rel.app_slug].android) {
      appReleasesMap[rel.app_slug].android = rel;
    }
    if (rel.platform === "ios" && !appReleasesMap[rel.app_slug].ios) {
      appReleasesMap[rel.app_slug].ios = rel;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/one-store-icon.png"
              alt="Kreatiflabs One Store Logo"
              className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-slate-200 transition-colors">
                Kreatiflabs
              </span>
              <span className="font-bold text-xl tracking-tight text-blue-400">
                One Store
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-14 pb-12 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-6">
            <ShieldCheck className="w-3.5 h-3.5" />
            Official App Distribution Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
            Distribusi Aplikasi Mobile <span className="text-blue-400">One Store</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Katalog aplikasi resmi Android (APK) &amp; iOS karya tim Kreatiflabs. Diunduh langsung berkecepatan tinggi tanpa perantara.
          </p>
        </div>
      </section>

      {/* App Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Katalog Aplikasi</h2>
            <p className="text-sm text-slate-400 mt-1">
              {apps.length} aplikasi siap diunduh
            </p>
          </div>
        </div>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300">Belum ada aplikasi yang dipublish</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
              Nantikan rilis aplikasi resmi terbaru dari Kreatiflabs di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => {
              const relMap = appReleasesMap[app.slug] || {};
              const hasAndroid = Boolean(relMap.android);
              const hasIos = Boolean(relMap.ios);
              const latestVersion = relMap.android?.version || relMap.ios?.version || "1.0.0";

              return (
                <div
                  key={app.id}
                  className="rounded-2xl border border-slate-800/80 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-700 transition-all duration-200 p-6 flex flex-col justify-between group shadow-sm hover:shadow-indigo-500/5"
                >
                  <div>
                    <div className="flex items-start gap-4">
                      {app.icon_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={app.icon_url}
                          alt={app.name}
                          className="w-16 h-16 rounded-2xl object-cover bg-slate-800 shadow-md border border-slate-700/50"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl shadow-md">
                          {app.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/60 inline-block mb-1">
                          {app.category || "App"}
                        </span>
                        <h3 className="text-lg font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                          {app.name}
                        </h3>
                        <p className="text-xs text-slate-400 truncate">
                          v{latestVersion} • oleh {app.author || "Kreatiflabs"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-slate-300 line-clamp-2 leading-relaxed">
                      {app.short_desc || app.description || "Aplikasi resmi dari tim Kreatiflabs."}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      {hasAndroid && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Smartphone className="w-3 h-3" /> APK
                        </span>
                      )}
                      {hasIos && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          <Apple className="w-3 h-3" /> iOS
                        </span>
                      )}
                      {!hasAndroid && !hasIos && (
                        <span className="text-slate-500 text-xs">Belum ada rilis</span>
                      )}
                    </div>

                    <Link
                      href={`/apps/${app.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Detail & Download
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} Kreatiflabs One Store.</p>
        </div>
      </footer>
    </div>
  );
}
