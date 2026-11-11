/**
 * Converts image URLs for safe viewing across both local development and production hosting.
 * Routes Cloudflare R2 bucket URLs through /api/image so images are fetched via S3 API,
 * completely bypassing Cloudflare WAF bot challenges (cf-mitigated: challenge) and CORS restrictions.
 */
export function getSafeImageUrl(url: string | undefined | null): string {
  if (!url) return "";

  // If already relative or already routed through /api/image, return as-is
  if (url.startsWith("/") || url.includes("/api/image")) return url;

  if (
    url.includes("store.kreatiflabs.com") ||
    url.includes("r2.dev") ||
    url.includes("cloudflarestorage.com")
  ) {
    return `/api/image?url=${encodeURIComponent(url)}`;
  }

  return url;
}
