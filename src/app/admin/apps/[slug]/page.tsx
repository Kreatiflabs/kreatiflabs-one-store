"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Check,
  Smartphone,
  Apple,
  ExternalLink,
  Layers,
  Image as ImageIcon,
  Save,
  CheckCircle,
  Plus,
  Package,
  HardDrive,
  Search,
} from "lucide-react";
import { getSafeImageUrl } from "@/lib/images";

interface AppDetail {
  id: string;
  slug: string;
  name: string;
  icon_url: string;
  category: string;
  short_desc: string;
  description: string;
  author: string;
  download_count?: number;
  is_published: number;
}

interface ReleaseItem {
  id: string;
  app_slug: string;
  platform: "android" | "ios";
  version: string;
  build_number: number;
  download_url: string;
  manifest_url: string;
  changelog: string;
  file_size_bytes: number;
  status: "draft" | "published";
  created_at: string;
}

interface ScreenshotItem {
  id: string;
  app_slug: string;
  image_url: string;
  caption: string;
  order_index: number;
}

function AdminAppDetailContent() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();

  const [app, setApp] = useState<AppDetail | null>(null);
  const [releases, setReleases] = useState<ReleaseItem[]>([]);
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Upload states with real-time progress
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconProgress, setIconProgress] = useState(0);

  const [uploadingScreenshots, setUploadingScreenshots] = useState(false);
  const [screenshotProgress, setScreenshotProgress] = useState({
    current: 0,
    total: 0,
    percent: 0,
    filename: "",
  });

  // Release modal states
  const [showAddReleaseModal, setShowAddReleaseModal] = useState(false);
  const [relPlatform, setRelPlatform] = useState<"android" | "ios">("android");
  const [relVersion, setRelVersion] = useState("1.0.0");
  const [relBuildNumber, setRelBuildNumber] = useState(1);
  const [relDownloadUrl, setRelDownloadUrl] = useState("");
  const [relManifestUrl, setRelManifestUrl] = useState("");
  const [relChangelog, setRelChangelog] = useState("");
  const [relFileSize, setRelFileSize] = useState(0);
  const [relStatus, setRelStatus] = useState<"published" | "draft">("published");
  const [uploadingApk, setUploadingApk] = useState(false);
  const [uploadingApkProgress, setUploadingApkProgress] = useState("");
  const [creatingRelease, setCreatingRelease] = useState(false);

  // R2 bucket files
  const [r2Files, setR2Files] = useState<Array<{ key: string; size: number; url: string }>>([]);
  const [loadingR2Files, setLoadingR2Files] = useState(false);
  const [r2Search, setR2Search] = useState("");

  const filteredR2Files = r2Files.filter((f) =>
    f.key.toLowerCase().includes(r2Search.toLowerCase().trim())
  );

  const fetchR2Files = async () => {
    try {
      setLoadingR2Files(true);
      const res = await fetch("/api/r2/files");
      const data = await res.json();
      if (data.files) {
        setR2Files(data.files);
      }
    } catch (err) {
      console.error("Gagal memuat list file R2:", err);
    } finally {
      setLoadingR2Files(false);
    }
  };

  const handleSelectR2File = (key: string) => {
    const selected = r2Files.find((f) => f.key === key);
    if (!selected) return;

    setRelDownloadUrl(selected.url);
    setRelFileSize(selected.size);

    if (selected.key.toLowerCase().endsWith(".ipa")) {
      setRelPlatform("ios");
    } else {
      setRelPlatform("android");
    }

    const match = selected.key.match(/(\d+\.\d+(\.\d+)?)/);
    if (match) {
      setRelVersion(match[1]);
    }
  };

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Tools");
  const [author, setAuthor] = useState("Kreatiflabs");
  const [shortDesc, setShortDesc] = useState("");
  const [description, setDescription] = useState("");
  const [downloadCount, setDownloadCount] = useState(0);
  const [isPublished, setIsPublished] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/apps/${slug}?include_drafts=true`);
      if (!res.ok) throw new Error("Gagal mengambil data aplikasi");
      const data = await res.json();

      setApp(data.app);
      setReleases(data.releases || []);
      setScreenshots(data.screenshots || []);

      setName(data.app.name);
      setCategory(data.app.category || "Tools");
      setAuthor(data.app.author || "Kreatiflabs");
      setShortDesc(data.app.short_desc || "");
      setDescription(data.app.description || "");
      setDownloadCount(data.app.download_count || 0);
      setIsPublished(Boolean(data.app.is_published));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [slug]);

  const handleSaveMetadata = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/apps/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          author,
          short_desc: shortDesc,
          description,
          download_count: downloadCount,
          is_published: isPublished ? 1 : 0,
        }),
      });

      if (!res.ok) throw new Error("Gagal menyimpan perubahan");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  // XHR upload helper for real-time progress events
  const uploadWithXHR = (
    url: string,
    method: string,
    body: XMLHttpRequestBodyInit,
    headers: Record<string, string>,
    onProgress?: (percent: number) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      Object.entries(headers).forEach(([k, v]) => {
        xhr.setRequestHeader(k, v);
      });
      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const p = Math.round((evt.loaded / evt.total) * 100);
            onProgress(p);
          }
        };
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText);
        } else {
          reject(new Error(`Upload status ${xhr.status}: ${xhr.statusText}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network Error"));
      xhr.send(body);
    });
  };

  // Upload to Cloudflare R2 with progress callback & automatic server fallback
  const uploadFileToR2 = async (
    file: File,
    folder: string,
    onProgress?: (percent: number) => void
  ) => {
    // 1. Coba upload direct presigned URL terlebih dahulu
    try {
      const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          folder,
        }),
      });

      if (presignRes.ok) {
        const { uploadUrl, publicUrl } = await presignRes.json();
        await uploadWithXHR(
          uploadUrl,
          "PUT",
          file,
          { "Content-Type": file.type || "application/octet-stream" },
          onProgress
        );
        if (onProgress) onProgress(100);
        return publicUrl;
      }
    } catch (presignErr) {
      console.warn("Direct upload blocked by CORS or network, falling back to server upload...", presignErr);
    }

    // 2. Fallback: upload server-side (100% bebas dari batasan CORS browser)
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const resText = await uploadWithXHR(
      "/api/upload",
      "POST",
      formData,
      {},
      onProgress
    );

    const parsed = JSON.parse(resText);
    if (!parsed.publicUrl) {
      throw new Error(parsed.error || "Gagal meng-upload file ke Cloudflare R2");
    }
    if (onProgress) onProgress(100);
    return parsed.publicUrl;
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingIcon(true);
      setIconProgress(0);
      const iconUrl = await uploadFileToR2(
        file,
        `apps/${slug}/icons`,
        (percent) => setIconProgress(percent)
      );

      // Update app icon_url in DB
      await fetch(`/api/apps/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icon_url: iconUrl }),
      });

      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingIcon(false);
      setIconProgress(0);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingScreenshots(true);
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setScreenshotProgress({
          current: i + 1,
          total: files.length,
          percent: 0,
          filename: file.name,
        });

        const imageUrl = await uploadFileToR2(
          file,
          `apps/${slug}/screenshots`,
          (percent) => {
            setScreenshotProgress((prev) => ({ ...prev, percent }));
          }
        );

        // Save screenshot record to DB
        await fetch("/api/screenshots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_slug: slug,
            image_url: imageUrl,
            order_index: screenshots.length + i,
          }),
        });
      }

      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingScreenshots(false);
      setScreenshotProgress({ current: 0, total: 0, percent: 0, filename: "" });
    }
  };

  const handleDeleteScreenshot = async (id: string) => {
    if (!confirm("Hapus screenshot ini?")) return;
    try {
      await fetch(`/api/screenshots?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApkDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingApk(true);
      setUploadingApkProgress(
        `Mengunggah ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB): 0%...`
      );
      setRelFileSize(file.size);

      const uploadedUrl = await uploadFileToR2(
        file,
        `releases/${slug}/v${relVersion || "1.0.0"}`,
        (percent) => {
          setUploadingApkProgress(
            `Mengunggah ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB): ${percent}%...`
          );
        }
      );
      setRelDownloadUrl(uploadedUrl);
      setUploadingApkProgress("Berhasil diunggah ke Cloudflare R2!");
    } catch (err: any) {
      alert("Gagal upload APK ke R2: " + err.message);
      setUploadingApkProgress("");
    } finally {
      setUploadingApk(false);
    }
  };

  const handleCreateRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relVersion || !relDownloadUrl) {
      alert("Versi dan Link Download APK/IPA wajib diisi!");
      return;
    }

    try {
      setCreatingRelease(true);
      const res = await fetch("/api/releases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_slug: slug,
          platform: relPlatform,
          version: relVersion,
          build_number: relBuildNumber,
          download_url: relDownloadUrl,
          manifest_url: relManifestUrl,
          changelog: relChangelog,
          file_size_bytes: relFileSize,
          status: relStatus,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan rilis");
      }

      setShowAddReleaseModal(false);
      setRelDownloadUrl("");
      setRelManifestUrl("");
      setRelChangelog("");
      setUploadingApkProgress("");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingRelease(false);
    }
  };

  const handleToggleReleaseStatus = async (rel: ReleaseItem) => {
    const newStatus = rel.status === "published" ? "draft" : "published";
    try {
      await fetch(`/api/releases/${rel.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRelease = async (id: string) => {
    if (!confirm("Hapus versi rilis ini?")) return;
    try {
      await fetch(`/api/releases/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteApp = async () => {
    if (
      !confirm(
        `PERINGATAN: Hapus aplikasi '${app?.name}' beserta semua screenshot dan rilisnya?`
      )
    ) {
      return;
    }
    try {
      await fetch(`/api/apps/${slug}`, { method: "DELETE" });
      router.push("/admin");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-sans">
        Memuat data aplikasi...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-sans gap-4">
        <p>Aplikasi tidak ditemukan.</p>
        <Link href="/admin" className="text-indigo-400 text-sm hover:underline">
          Kembali ke Admin
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-bold text-sm text-white sm:text-base">{app.name}</h1>
              <span className="text-[11px] text-slate-400 font-mono">/{app.slug}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isPublished ? (
              <Link
                href={`/apps/${app.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Lihat di Store
              </Link>
            ) : null}

            <button
              onClick={handleSaveMetadata}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-300" /> Tersimpan!
                </>
              ) : saving ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan Pengaturan
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        {/* App Info & Icon */}
        <section className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-6">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" /> Informasi Utama & Ikon
          </h2>

          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Icon Uploader */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
                {app.icon_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getSafeImageUrl(app.icon_url)}
                    alt={app.name}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-slate-500">
                    {app.name.slice(0, 2).toUpperCase()}
                  </span>
                )}

                {/* Progress Overlay */}
                {uploadingIcon && (
                  <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-2.5 text-center">
                    <span className="text-[11px] font-bold text-blue-400 mb-1">
                      {iconProgress}%
                    </span>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden border border-slate-700">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-150 rounded-full"
                        style={{ width: `${iconProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors border border-slate-700">
                <Upload className="w-3 h-3" />
                {uploadingIcon ? `Mengunggah (${iconProgress}%)` : "Ganti Icon"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  disabled={uploadingIcon}
                  className="hidden"
                />
              </label>
            </div>

            {/* Inputs */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Nama Aplikasi
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  <option value="Tools">Tools</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Business">Business</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Communication">Communication</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Author / Pembuat</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Jumlah Download (Display Counter)</label>
                <input
                  type="number"
                  min="0"
                  value={downloadCount}
                  onChange={(e) => setDownloadCount(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Status Publikasi</label>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`w-full px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-colors ${
                    isPublished
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  <span>{isPublished ? "Published (Tampil di Store)" : "Draft (Tersembunyi)"}</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isPublished ? "bg-emerald-500 border-emerald-400" : "border-slate-600"
                    }`}
                  >
                    {isPublished && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                  </div>
                </button>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Deskripsi Singkat (1-2 kalimat)
                </label>
                <input
                  type="text"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Deskripsi Lengkap / Fitur Utama
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan fitur-fitur aplikasi secara lengkap..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Screenshots Manager (Cloudflare R2 Direct Upload) */}
        <section className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" /> Screenshot Aplikasi (Cloudflare R2)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Gambar langsung di-upload ke bucket Cloudflare R2 tanpa membebani server Vercel.
              </p>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700">
              <Upload className="w-3.5 h-3.5" />
              {uploadingScreenshots
                ? `Mengunggah (${screenshotProgress.current}/${screenshotProgress.total})...`
                : "Upload Screenshot Baru"}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleScreenshotUpload}
                disabled={uploadingScreenshots}
                className="hidden"
              />
            </label>
          </div>

          {/* Real-time Progress Bar for Screenshots Upload */}
          {uploadingScreenshots && (
            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-white space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  Mengunggah screenshot {screenshotProgress.current} dari {screenshotProgress.total}:{" "}
                  <span className="font-mono text-slate-300 truncate max-w-xs">{screenshotProgress.filename}</span>
                </span>
                <span className="font-bold text-blue-400 font-mono text-sm">
                  {screenshotProgress.percent}%
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-blue-500/20 p-0.5">
                <div
                  className="bg-gradient-to-r from-blue-500 via-sky-400 to-emerald-400 h-full transition-all duration-150 rounded-full"
                  style={{ width: `${screenshotProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {screenshots.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
              Belum ada screenshot yang di-upload. Klik tombol di atas untuk menambah screenshot.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {screenshots.map((ss) => (
                <div
                  key={ss.id}
                  className="group relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[9/16] shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getSafeImageUrl(ss.image_url)}
                    alt="Screenshot"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteScreenshot(ss.id)}
                      className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors"
                      title="Hapus Screenshot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Releases Manager */}
        <section className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-slate-900/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" /> Rilis APK & iOS (GitHub Actions & R2)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Build otomatis dari GitHub Actions atau upload file APK/IPA manual langsung ke Cloudflare R2.
              </p>
            </div>

            <button
              onClick={() => {
                setShowAddReleaseModal(true);
                fetchR2Files();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Tambah / Upload Rilis Manual
            </button>
          </div>

          {releases.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
              Belum ada build rilis yang masuk untuk slug <span className="font-mono text-indigo-300">`{slug}`</span>.
              Jalankan GitHub Actions workflow untuk meng-upload file build pertama.
            </div>
          ) : (
            <div className="space-y-3">
              {releases.map((rel) => (
                <div
                  key={rel.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">v{rel.version}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1">
                        {rel.platform === "android" ? <Smartphone className="w-3 h-3" /> : <Apple className="w-3 h-3" />}
                        {rel.platform}
                      </span>
                      <span className="text-xs text-slate-500">
                        Build #{rel.build_number} • {new Date(rel.created_at).toLocaleString()}
                      </span>
                    </div>

                    {rel.changelog && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{rel.changelog}</p>
                    )}

                    <div className="text-[11px] font-mono text-indigo-400/80 truncate max-w-lg mt-1">
                      {rel.download_url}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleReleaseStatus(rel)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                        rel.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                      }`}
                    >
                      {rel.status === "published" ? "Published (Aktif)" : "Draft (Klik to Publish)"}
                    </button>

                    <button
                      onClick={() => handleDeleteRelease(rel.id)}
                      className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Hapus Rilis"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger Zone */}
        <section className="p-6 rounded-3xl border border-red-500/20 bg-red-500/5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-400">Hapus Aplikasi</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Menghapus aplikasi ini dari katalog beserta seluruh riwayat rilis dan screenshot.
            </p>
          </div>
          <button
            onClick={handleDeleteApp}
            className="px-4 py-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white text-xs font-semibold transition-colors"
          >
            Hapus Aplikasi
          </button>
        </section>

        {/* Modal Tambah / Upload Rilis */}
        {showAddReleaseModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-400" /> Tambah Rilis APK / iOS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddReleaseModal(false)}
                  className="text-slate-400 hover:text-white text-xs font-medium"
                >
                  Tutup
                </button>
              </div>

              <form onSubmit={handleCreateRelease} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Platform
                    </label>
                    <select
                      value={relPlatform}
                      onChange={(e) => setRelPlatform(e.target.value as "android" | "ios")}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="android">Android (.apk)</option>
                      <option value="ios">iOS (.ipa)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Nomor Versi
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1.0.1"
                      value={relVersion}
                      onChange={(e) => setRelVersion(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    >
                    </input>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Build Number
                    </label>
                    <input
                      type="number"
                      required
                      value={relBuildNumber}
                      onChange={(e) => setRelBuildNumber(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Status Publikasi
                    </label>
                    <select
                      value={relStatus}
                      onChange={(e) => setRelStatus(e.target.value as "published" | "draft")}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="published">Published (Bisa diunduh)</option>
                      <option value="draft">Draft (Disembunyikan)</option>
                    </select>
                  </div>
                </div>

                {/* R2 Dropdown Selector */}
                <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5" /> Pilih dari File R2 yang Sudah Ada:
                    </label>
                    <button
                      type="button"
                      onClick={fetchR2Files}
                      className="text-[11px] text-indigo-400 hover:text-indigo-200 transition-colors"
                    >
                      {loadingR2Files ? "Memuat..." : "↻ Refresh List R2"}
                    </button>
                  </div>

                  {/* Search box for R2 files */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari file R2 (misal: alquran, arm64, 1.0.1)..."
                      value={r2Search}
                      onChange={(e) => setR2Search(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <select
                    onChange={(e) => handleSelectR2File(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="">
                      -- {loadingR2Files ? "Sedang memuat file R2..." : filteredR2Files.length === 0 ? "Tidak ada file yang cocok dengan pencarian" : `Pilih File dari R2 (${filteredR2Files.length} file ditemukan)`} --
                    </option>
                    {filteredR2Files.map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.key} ({(f.size / (1024 * 1024)).toFixed(1)} MB)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    * Memilih file dari dropdown otomatis mengisi Download URL, versi, dan ukuran file.
                  </p>
                </div>

                <div className="flex items-center gap-3 my-2 text-xs text-slate-500">
                  <div className="flex-1 border-t border-slate-800"></div>
                  <span>ATAU UPLOAD FILE BARU</span>
                  <div className="flex-1 border-t border-slate-800"></div>
                </div>

                {/* File Upload to R2 Box */}
                <div className="p-4 rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Upload className="w-4 h-4" /> Upload File Langsung ke Cloudflare R2
                    </span>
                  </div>

                  <label className="cursor-pointer block">
                    <div className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-950/80 hover:bg-slate-800/80 transition-colors text-center text-xs text-slate-300 font-medium">
                      {uploadingApk ? "Sedang Mengunggah..." : "Pilih File .APK atau .IPA dari Komputer"}
                    </div>
                    <input
                      type="file"
                      accept=".apk,.ipa,.aab"
                      onChange={handleApkDirectUpload}
                      disabled={uploadingApk}
                      className="hidden"
                    />
                  </label>

                  {uploadingApkProgress && (
                    <p className="text-[11px] text-indigo-400 font-medium text-center">
                      {uploadingApkProgress}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Download URL (Otomatis terisi jika upload, atau paste link R2 kamu)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://store.kreatiflabs.com/apk/app.apk"
                    value={relDownloadUrl}
                    onChange={(e) => setRelDownloadUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                {relPlatform === "ios" && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Manifest Plist URL (Khusus iOS OTA Install)
                    </label>
                    <input
                      type="url"
                      placeholder="https://store.kreatiflabs.com/manifests/app.plist"
                      value={relManifestUrl}
                      onChange={(e) => setRelManifestUrl(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Changelog / Apa yang Baru di Versi Ini
                  </label>
                  <textarea
                    rows={3}
                    placeholder="• Penambahan fitur baru&#10;• Perbaikan bug"
                    value={relChangelog}
                    onChange={(e) => setRelChangelog(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddReleaseModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={creatingRelease || uploadingApk}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {creatingRelease ? "Menyimpan..." : "Simpan & Publikasikan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminAppDetailPage() {
  return (
    <AdminAuthGuard>
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-500 font-sans">
            Memuat halaman admin...
          </div>
        }
      >
        <AdminAppDetailContent />
      </Suspense>
    </AdminAuthGuard>
  );
}
