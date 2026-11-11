"use client";

import { useState } from "react";
import { Download, Smartphone, Apple, Check, Loader2 } from "lucide-react";

interface DownloadButtonProps {
  slug: string;
  platform: "android" | "ios";
  version: string;
  downloadUrl: string;
  manifestUrl?: string;
  fileSizeBytes?: number;
  onDownloadIncrement?: () => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function DownloadButton({
  slug,
  platform,
  version,
  downloadUrl,
  manifestUrl,
  fileSizeBytes,
  onDownloadIncrement,
}: DownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const sizeText = formatBytes(fileSizeBytes);

  const handleClick = async () => {
    setDownloading(true);

    // Track download in background
    try {
      fetch(`/api/apps/${slug}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      }).catch(() => {});
      if (onDownloadIncrement) onDownloadIncrement();
    } catch {
      // non-blocking
    }

    // Trigger download
    if (platform === "ios" && manifestUrl) {
      window.location.href = `itms-services://?action=download-manifest&url=${encodeURIComponent(
        manifestUrl
      )}`;
    } else {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setTimeout(() => {
      setDownloading(false);
    }, 2000);
  };

  if (platform === "android") {
    return (
      <button
        onClick={handleClick}
        disabled={downloading}
        className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
      >
        {downloading ? (
          <Check className="w-4 h-4 animate-bounce text-emerald-200" />
        ) : (
          <Smartphone className="w-4 h-4" />
        )}
        <span>
          {downloading ? "Mengunduh APK..." : `Download APK (v${version})`}
        </span>
        {sizeText && (
          <span className="text-xs bg-emerald-700/60 px-2 py-0.5 rounded-full font-mono text-emerald-100">
            {sizeText}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={downloading}
      className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/35 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
    >
      {downloading ? (
        <Check className="w-4 h-4 animate-bounce text-sky-200" />
      ) : (
        <Apple className="w-4 h-4" />
      )}
      <span>
        {downloading ? "Memulai Instalasi..." : `Install iOS (v${version})`}
      </span>
      {sizeText && (
        <span className="text-xs bg-sky-700/60 px-2 py-0.5 rounded-full font-mono text-sky-100">
          {sizeText}
        </span>
      )}
    </button>
  );
}
