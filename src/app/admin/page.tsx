"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft, RefreshCw, Smartphone, Apple, ExternalLink, Settings, Sparkles, LogOut, Search, Download } from "lucide-react";
import { AdminAuthGuard } from "@/components/AdminAuthGuard";

interface AppItem {
  id: string;
  slug: string;
  name: string;
  icon_url: string;
  category: string;
  short_desc: string;
  download_count?: number;
  is_published: number;
  updated_at: string;
}

export default function AdminPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const filteredApps = apps.filter((a) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.short_desc.toLowerCase().includes(q)
    );
  });

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCategory, setFormCategory] = useState("Tools");
  const [formShortDesc, setFormShortDesc] = useState("");
  const [formError, setFormError] = useState("");

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/apps?include_drafts=true");
      const data = await res.json();
      if (data.apps) {
        setApps(data.apps);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setCreating(true);

    try {
      const res = await fetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          slug: formSlug,
          category: formCategory,
          short_desc: formShortDesc,
          is_published: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat aplikasi");
      }

      setShowCreateModal(false);
      setFormName("");
      setFormSlug("");
      setFormShortDesc("");
      fetchApps();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!formSlug || formSlug === "") {
      setFormSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
      );
    }
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Lihat Store Publik"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/one-store-icon.png"
                alt="One Store Logo"
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-white">Kreatiflabs</span>
                <span className="font-bold text-base text-blue-400">One Store</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-800 text-indigo-300 ml-1 border border-slate-700">Admin</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await fetch("/api/admin/auth", { method: "DELETE" });
                window.location.reload();
              }}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Logout Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={fetchApps}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" /> Tambah Aplikasi Baru
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Daftar Aplikasi</h2>
            <p className="text-sm text-slate-400 mt-1">
              Kelola aplikasi, upload screenshot ke Cloudflare R2, dan publikasikan rilis APK/iOS.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari aplikasi atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Memuat data aplikasi...</div>
        ) : apps.length === 0 ? (
          <div className="p-12 rounded-3xl border border-dashed border-slate-800 text-center bg-slate-900/30">
            <p className="text-slate-400 font-medium">Belum ada aplikasi yang terdaftar.</p>
            <p className="text-xs text-slate-500 mt-1">
              Tambahkan aplikasi manual atau jalankan workflow GitHub Actions untuk mendaftarkan build secara otomatis.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
            >
              Buat Aplikasi Pertama
            </button>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 text-center text-xs text-slate-400">
            Tidak ada aplikasi yang cocok dengan pencarian &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {app.icon_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={app.icon_url}
                          alt={app.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-800 border border-slate-700"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
                          {app.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-white text-base leading-snug">{app.name}</h3>
                        <span className="text-xs text-slate-400 font-mono">/{app.slug}</span>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        app.is_published
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}
                    >
                      {app.is_published ? "Published" : "Draft"}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-400 line-clamp-2">
                    {app.short_desc || "Belum ada deskripsi singkat."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      {app.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                      <Download className="w-3 h-3" /> {(app.download_count || 0).toLocaleString("id-ID")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {app.is_published ? (
                      <Link
                        href={`/apps/${app.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Lihat Halaman Publik"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : null}

                    <Link
                      href={`/admin/apps/${app.slug}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors border border-slate-700"
                    >
                      <Settings className="w-3.5 h-3.5" /> Kelola App
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Tambah Aplikasi */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Tambah Aplikasi Baru</h3>

            {formError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateApp} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Nama Aplikasi
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Kreatif Pos"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Slug URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="kreatif-pos"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Kategori</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
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
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Deskripsi Singkat
                </label>
                <input
                  type="text"
                  placeholder="Aplikasi kasir cepat untuk bisnis..."
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {creating ? "Menyimpan..." : "Simpan Aplikasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminAuthGuard>
  );
}
