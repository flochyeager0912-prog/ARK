/**
 * Image loader for the static preview only (next.config.ts): GitHub Pages can't resize images on
 * request, so the original file is served — under the preview's sub-path.
 */
export default function previewImageLoader({ src }: { src: string; width: number; quality?: number }) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return src.startsWith("/") && !src.startsWith("//") ? `${base}${src}` : src;
}
