/**
 * Converts image URLs for safe cross-origin viewing.
 * In localhost development, routes through local /api/image to bypass browser CORP blocking.
 * In production (Vercel on one.kreatiflabs.com), direct R2 domain URLs load cleanly.
 */
export function getSafeImageUrl(url: string | undefined | null): string {
  if (!url) return "";
  
  // If already relative, return as-is
  if (url.startsWith("/")) return url;

  // On localhost/127.0.0.1, always proxy through local API to avoid Firefox NS_ERROR_DOM_CORP_FAILED
  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocal && (url.includes("store.kreatiflabs.com") || url.includes("r2.dev"))) {
      return `/api/image?url=${encodeURIComponent(url)}`;
    }
  }

  return url;
}
