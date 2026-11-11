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
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import DownloadButton from "@/components/DownloadButton";
import ScreenshotGallery from "@/components/ScreenshotGallery";
import { getSafeImageUrl } from "@/lib/images";

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
  const downloadCount = app.download_count || 0;

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#070a13]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Katalog
          </Link>
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/one-store-icon.png" alt="One Store" className="w-6 h-6 object-contain" />
            <span className="text-xs font-bold text-white">Kreatiflabs</span>
            <span className="text-xs font-extrabold bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
              One Store
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full space-y-10">
        {/* App Hero Card */}
        <div className="relative rounded-3xl border border-slate-800/90 bg-gradient-to-b from-slate-900/90 to-slate-950/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-start gap-6">
            {app.icon_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={getSafeImageUrl(app.icon_url)}
                alt={app.name}
                crossOrigin="anonymous"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover bg-slate-800 shadow-xl border border-slate-700/60"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 border border-white/10 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl shadow-blue-500/10">
                {app.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/60">
                  {app.category || "Tools"}
                </span>

                {/* TAMPILAN JUMLAH DOWNLOAD */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold shadow-sm">
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadCount.toLocaleString("id-ID")} Total Unduhan</span>
                </div>

                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Aman &amp; Terverifikasi</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {app.name}
              </h1>
              <p className="mt-1 text-xs text-slate-400">
                Dikembangkan oleh <strong className="text-slate-200">{app.author || "Kreatiflabs"}</strong>
              </p>

              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl">
                {app.short_desc || "Aplikasi resmi karya tim Kreatiflabs."}
              </p>

              {/* Action Buttons (with automatic download count tracking) */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {latestAndroid && (
                  <DownloadButton
                    slug={app.slug}
                    platform="android"
                    version={latestAndroid.version}
                    downloadUrl={latestAndroid.download_url}
                    fileSizeBytes={latestAndroid.file_size_bytes}
                  />
                )}

                {latestIos && (
                  <DownloadButton
                    slug={app.slug}
                    platform="ios"
                    version={latestIos.version}
                    downloadUrl={latestIos.download_url}
                    manifestUrl={latestIos.manifest_url}
                    fileSizeBytes={latestIos.file_size_bytes}
                  />
                )}

                {!latestAndroid && !latestIos && (
                  <div className="text-xs text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Belum ada versi rilis publik yang tersedia untuk aplikasi ini.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Screenshots Section with Interactive Swipe, Drag & Lightbox */}
        <ScreenshotGallery screenshots={screenshots} />

        {/* Description Section */}
        {app.description && (
          <div className="rounded-3xl border border-slate-850 bg-slate-900/40 p-6 sm:p-8 space-y-4">
            <h2 className="text-xl font-bold text-white tracking-tight">Tentang Aplikasi</h2>
            <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line prose prose-invert max-w-none">
              {app.description}
            </div>
          </div>
        )}

        {/* Version History & Changelogs */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> Riwayat Versi &amp; Rilis
          </h2>

          {releases.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400 bg-slate-900/30">
              Belum ada riwayat rilis untuk aplikasi ini.
            </div>
          ) : (
            <div className="space-y-3">
              {releases.map((rel) => {
                const isAndroid = rel.platform === "android";
                const sizeText = formatBytes(rel.file_size_bytes);

                return (
                  <div
                    key={rel.id}
                    className="rounded-2xl border border-slate-850 bg-slate-900/50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-750 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            isAndroid
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                          }`}
                        >
                          {isAndroid ? <Smartphone className="w-3.5 h-3.5" /> : <Apple className="w-3.5 h-3.5" />}
                          {isAndroid ? "Android (APK)" : "iOS (IPA)"}
                        </span>

                        <h3 className="font-bold text-white text-sm">
                          Versi {rel.version}
                          <span className="text-xs font-normal text-slate-400 ml-1.5">
                            (Build #{rel.build_number})
                          </span>
                        </h3>
                      </div>

                      {rel.changelog &&
                        !rel.changelog.toLowerCase().startsWith("rilis file dari r2") && (
                          <p className="text-xs text-slate-300 mt-2 whitespace-pre-line bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                            {rel.changelog}
                          </p>
                        )}

                      <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-slate-500" /> {sizeText}
                        </span>
                        <span>
                          Rilis: {new Date(rel.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <DownloadButton
                        slug={app.slug}
                        platform={rel.platform}
                        version={rel.version}
                        downloadUrl={rel.download_url}
                        manifestUrl={rel.manifest_url}
                        fileSizeBytes={rel.file_size_bytes}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500 bg-[#060810]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/one-store-icon.png" alt="One Store" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-slate-300">Kreatiflabs One Store</span>
          </div>
          <p>© {new Date().getFullYear()} Kreatiflabs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
