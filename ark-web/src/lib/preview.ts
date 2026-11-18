/**
 * Static review preview (GitHub Pages). Set at build time by `STATIC_PREVIEW=1`
 * (see next.config.ts and scripts/static-preview.mjs).
 *
 * The preview is a read-only snapshot of the public site served under a sub-path
 * (e.g. https://<user>.github.io/ARK/): forms don't send, and there's no admin.
 */
export const isStaticPreview = process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1";

/** "" normally, "/ARK" in the preview. Next.js prefixes <Link> and assets itself; use this for raw URLs. */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => (path.startsWith("/") && !path.startsWith("//") ? `${basePath}${path}` : path);
