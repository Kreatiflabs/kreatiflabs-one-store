"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Smartphone,
  Apple,
  Layers,
  ArrowRight,
  Filter,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { getSafeImageUrl } from "@/lib/images";
import type { AppModel, ReleaseModel } from "@/lib/db";

interface AppCatalogProps {
  initialApps: AppModel[];
  appReleasesMap: Record<string, { android?: ReleaseModel; ios?: ReleaseModel }>;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function AppCatalog({
  initialApps,
  appReleasesMap,
}: AppCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [platformFilter, setPlatformFilter] = useState<"all" | "android" | "ios">("all");

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialApps.forEach((a) => {
      if (a.category) set.add(a.category);
    });
    return ["Semua", ...Array.from(set)];
  }, [initialApps]);

  // Filtered apps
  const filteredApps = useMemo(() => {
    return initialApps.filter((app) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.name.toLowerCase().includes(q) ||
        (app.short_desc || "").toLowerCase().includes(q) ||
        (app.category || "").toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === "Semua" ||
        app.category?.toLowerCase() === selectedCategory.toLowerCase();

      const rel = appReleasesMap[app.slug] || {};
      const matchesPlatform =
        platformFilter === "all" ||
        (platformFilter === "android" && Boolean(rel.android)) ||
        (platformFilter === "ios" && Boolean(rel.ios));

      return matchesSearch && matchesCat && matchesPlatform;
    });
  }, [initialApps, searchQuery, selectedCategory, platformFilter, appReleasesMap]);

  // Total downloads aggregate
  const totalDownloads = useMemo(() => {
    return initialApps.reduce((acc, app) => acc + (app.download_count || 0), 0);
  }, [initialApps]);

  return (
    <div className="space-y-8">
      {/* Search & Category Filter Bar */}
      <div className="rounded-2xl border border-slate-800/90 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-md shadow-xl shadow-black/20 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama aplikasi, kategori, atau fitur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>

          {/* Platform Toggle */}
          <div className="inline-flex rounded-xl bg-slate-950/90 p-1 border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setPlatformFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                platformFilter === "all"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setPlatformFilter("android")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                platformFilter === "android"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3 h-3" /> Android
            </button>
            <button
              onClick={() => setPlatformFilter("ios")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                platformFilter === "ios"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Apple className="w-3 h-3" /> iOS
            </button>
          </div>
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            <span className="text-xs text-slate-500 flex items-center gap-1 pl-1 pr-2">
              <Filter className="w-3 h-3" /> Kategori:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-xl border whitespace-nowrap transition-all font-medium cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-blue-500/15 border-blue-500/50 text-blue-400 shadow-sm shadow-blue-500/10 font-semibold"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Catalog Header & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Katalog Aplikasi
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredApps.length} Aplikasi
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Diunduh langsung secara cepat dan aman untuk perangkat Android &amp; iOS.
          </p>
        </div>

        {totalDownloads > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-sm">
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Total <strong className="text-white font-bold">{totalDownloads.toLocaleString("id-ID")}</strong> unduhan
            </span>
          </div>
        )}
      </div>

      {/* Grid of Apps */}
      {filteredApps.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-800 p-12 text-center bg-slate-900/30">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300">
            {searchQuery
              ? `Tidak ada aplikasi yang cocok dengan "${searchQuery}"`
              : "Belum ada aplikasi yang dipublikasikan"}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
            {searchQuery
              ? "Coba gunakan kata kunci pencarian yang berbeda atau pilih kategori lain."
              : "Nantikan rilis aplikasi resmi terbaru dari Kreatiflabs di sini."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => {
            const relMap = appReleasesMap[app.slug] || {};
            const hasAndroid = Boolean(relMap.android);
            const hasIos = Boolean(relMap.ios);
            const latest = relMap.android || relMap.ios;
            const latestVersion = latest?.version || "1.0.0";
            const sizeString = formatBytes(latest?.file_size_bytes);
            const count = app.download_count || 0;

            return (
              <div
                key={app.id}
                className="group relative rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950/80 p-6 flex flex-col justify-between hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Subtle colorful hover glow border indicator */}
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top Meta: Category + Download Count Badge */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 inline-flex items-center">
                      {app.category || "App"}
                    </span>

                    {/* TAMPILAN JUMLAH DOWNLOAD */}
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold shadow-sm"
                      title={`${count.toLocaleString("id-ID")} total unduhan`}
                    >
                      <Download className="w-3 h-3 text-blue-400" />
                      <span>{count.toLocaleString("id-ID")} Unduhan</span>
                    </div>
                  </div>

                  {/* App Icon + Title */}
                  <div className="flex items-start gap-4">
                    {app.icon_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={getSafeImageUrl(app.icon_url)}
                        alt={app.name}
                        crossOrigin="anonymous"
                        className="w-16 h-16 rounded-2xl object-cover bg-slate-800 shadow-md border border-slate-700/50 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 border border-white/10 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform">
                        {app.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-extrabold text-white truncate group-hover:text-blue-300 transition-colors">
                        {app.name}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        v{latestVersion} {sizeString ? `• ${sizeString}` : ""} • {app.author || "Kreatiflabs"}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-4 text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
                    {app.short_desc || app.description || "Aplikasi resmi karya tim Kreatiflabs."}
                  </p>
                </div>

                {/* Footer Platform chips & Action Button */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs">
                    {hasAndroid && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                        <Smartphone className="w-3 h-3" /> APK
                      </span>
                    )}
                    {hasIos && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium text-[11px]">
                        <Apple className="w-3 h-3" /> iOS
                      </span>
                    )}
                    {!hasAndroid && !hasIos && (
                      <span className="text-slate-500 text-xs">Belum ada rilis</span>
                    )}
                  </div>

                  <Link
                    href={`/apps/${app.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/30"
                  >
                    <span>Detail & Unduh</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
