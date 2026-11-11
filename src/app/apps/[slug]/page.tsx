import Link from "next/link";
import { notFound } from "next/navigation";
import {
  executeQuery,
  initDatabase,
  type AppModel,
  type ReleaseModel,
  type ScreenshotModel,
} from "@/lib/db";
import {
  ArrowLeft,
  Smartphone,
  Apple,
  Download,
  Calendar,
  Layers,
  HardDrive,
  Info,
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "Unknown size";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await initDatabase();
  const { slug } = await params;

  const apps = await executeQuery<AppModel>(
    "SELECT * FROM apps WHERE slug = ? AND is_published = 1 LIMIT 1",
    [slug]
  );

  if (apps.length === 0) {
    notFound();
  }

  const app = apps[0];

  const releases = await executeQuery<ReleaseModel>(
    "SELECT * FROM releases WHERE app_slug = ? AND status = 'published' ORDER BY build_number DESC, created_at DESC",
    [slug]
  );

  const screenshots = await executeQuery<ScreenshotModel>(
    "SELECT * FROM screenshots WHERE app_slug = ? ORDER BY order_index ASC, created_at ASC",
    [slug]
  );

  const latestAndroid = releases.find((r) => r.platform === "android");
  const latestIos = releases.find((r) => r.platform === "ios");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Katalog
          </Link>
          <div className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="One Store" className="w-5 h-5 rounded-md" />
            <span className="text-xs font-bold text-white">Kreatiflabs</span>
            <span className="text-xs font-bold text-blue-400">One Store</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-10">
        {/* App Hero */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            {app.icon_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={app.icon_url}
                alt={app.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover bg-slate-800 shadow-xl border border-slate-700/60"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-3xl shadow-xl">
                {app.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {app.category || "Tools"}
                </span>
                <span className="text-xs text-slate-400">oleh {app.author || "Kreatiflabs"}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {app.name}
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
                {app.short_desc || "Aplikasi resmi karya tim Kreatiflabs."}
              </p>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {latestAndroid && (
                  <a
                    href={latestAndroid.download_url}
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20"
                  >
                    <Smartphone className="w-4 h-4" />
                    Download APK (v{latestAndroid.version})
                  </a>
                )}

                {latestIos && (
                  <a
                    href={
                      latestIos.manifest_url
                        ? `itms-services://?action=download-manifest&url=${encodeURIComponent(
                            latestIos.manifest_url
                          )}`
                        : latestIos.download_url
                    }
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-600/20"
                  >
                    <Apple className="w-4 h-4" />
                    Install iOS (v{latestIos.version})
                  </a>
                )}

                {!latestAndroid && !latestIos && (
                  <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Belum ada versi rilis publik yang tersedia untuk aplikasi ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Screenshots Section (loaded directly from Cloudflare R2!) */}
        {screenshots.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Screenshot Aplikasi
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
              {screenshots.map((ss) => (
                <div
                  key={ss.id}
                  className="flex-shrink-0 w-64 sm:w-72 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-md snap-start"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ss.image_url}
                    alt={ss.caption || "Screenshot"}
                    className="w-full h-auto object-cover max-h-[500px]"
                    loading="lazy"
                  />
                  {ss.caption && (
                    <div className="p-3 text-xs text-slate-400 border-t border-slate-800 text-center">
                      {ss.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {app.description && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Tentang Aplikasi</h2>
            <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {app.description}
            </div>
          </div>
        )}

        {/* Release History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" /> Riwayat Rilis & Changelog
          </h2>

          {releases.length === 0 ? (
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/30 text-sm text-slate-500">
              Belum ada riwayat rilis publik.
            </div>
          ) : (
            <div className="space-y-3">
              {releases.map((rel) => (
                <div
                  key={rel.id}
                  className="p-5 rounded-2xl border border-slate-800/80 bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">v{rel.version}</span>
                      <span className="text-[11px] uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                        {rel.platform}
                      </span>
                      <span className="text-xs text-slate-500">
                        Build #{rel.build_number} • {new Date(rel.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {rel.changelog && (
                      <p className="text-xs text-slate-300 mt-2 whitespace-pre-line">
                        {rel.changelog}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" /> {formatBytes(rel.file_size_bytes)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={rel.download_url}
                    download
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" /> Unduh File
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
