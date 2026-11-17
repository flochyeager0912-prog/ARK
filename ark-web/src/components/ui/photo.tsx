import Image from "next/image";
import { cn } from "@/lib/utils";

/** Responsive photo with consistent rounded framing and a hairline border. */
export function Photo({
  src,
  alt,
  className,
  ratio = "4/3",
  priority,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  zoom = false,
  fit = "cover",
}: {
  src: string;
  alt: string;
  className?: string;
  ratio?: "4/3" | "3/4" | "1/1" | "16/9" | "4/5";
  priority?: boolean;
  sizes?: string;
  /** Gentle zoom when a parent `.group` is hovered. */
  zoom?: boolean;
  /**
   * "contain": show the whole picture over a softly blurred copy of itself. For small or oddly
   * shaped source images that would turn blurry or lose their subject if cropped to fill the frame.
   */
  fit?: "cover" | "contain";
}) {
  const aspect = { "4/3": "aspect-[4/3]", "3/4": "aspect-[3/4]", "1/1": "aspect-square", "16/9": "aspect-video", "4/5": "aspect-[4/5]" }[ratio];
  if (fit === "contain") {
    return (
      <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-white/[0.04]", aspect, className)}>
        <Image src={src} alt="" aria-hidden fill sizes="64px" className="scale-110 object-cover opacity-45 blur-2xl" />
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain drop-shadow-[0_10px_30px_rgb(0_0_0/0.45)]" />
      </div>
    );
  }
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-line bg-white/[0.04]", aspect, className)}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", zoom && "transition-transform duration-700 ease-(--ease-out-soft) group-hover:scale-[1.04]")}
      />
    </div>
  );
}
