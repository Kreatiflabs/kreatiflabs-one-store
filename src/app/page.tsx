import Link from "next/link";
import { executeQuery, initDatabase, type AppModel, type ReleaseModel } from "@/lib/db";
import { ShieldCheck, Download } from "lucide-react";
import AppCatalog from "@/components/AppCatalog";

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

  const totalDownloads = apps.reduce((sum, app) => sum + (app.download_count || 0), 0);

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800/80 bg-[#070a13]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/one-store-icon.png"
              alt="Kreatiflabs One Store Logo"
              className="w-10 h-10 object-contain drop-shadow-[0_4px_12px_rgba(59,130,246,0.3)] group-hover:scale-105 transition-transform"
            />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-slate-200 transition-colors">
                Kreatiflabs
              </span>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                One Store
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href="https://www.kreatiflabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-medium transition-all"
            >
              <span className="text-slate-500 text-[11px]">by</span>
              <span className="font-semibold text-slate-200">Kreatiflabs</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section with Logo-inspired Aurora Glow */}
      <section className="relative overflow-hidden pt-16 pb-16 border-b border-slate-850">
        {/* Logo-inspired multi-color ambient lighting: Blue, Emerald, Warm Amber glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.18)_0%,rgba(16,185,129,0.12)_35%,rgba(245,158,11,0.06)_70%,transparent_100%)] blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-amber-500/10 border border-slate-750 text-slate-200 text-xs font-semibold mb-6 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/one-store-icon.png" alt="Icon" className="w-4 h-4 object-contain" />
            <span className="text-white">Official App Store</span>
            <span className="text-slate-500">•</span>
            <span className="text-blue-400 font-bold">Kreatiflabs Ecosystem</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Distribusi Aplikasi Mobile{" "}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              One Store
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-300/90 max-w-2xl mx-auto leading-relaxed">
            Pusat rilis resmi aplikasi Android karya tim Kreatiflabs. 
            Unduh langsung berkecepatan tinggi tanpa iklan dan perantara.
          </p>

          {/* Trust Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Bebas Iklan &amp; Aman</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog with Interactive Search, Filter, and Download Count Display */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <AppCatalog initialApps={apps} appReleasesMap={appReleasesMap} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500 bg-[#060810]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/one-store-icon.png" alt="One Store" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-slate-300">Kreatiflabs One Store</span>
          </div>
          <p>© {new Date().getFullYear()} Kreatiflabs One Store. <a href="https://www.kreatiflabs.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">www.kreatiflabs.com</a></p>
        </div>
      </footer>
    </div>
  );
}
