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
}: {
  src: string;
  alt: string;
  className?: string;
  ratio?: "4/3" | "3/4" | "1/1" | "16/9" | "4/5";
  priority?: boolean;
  sizes?: string;
  /** Gentle zoom when a parent `.group` is hovered. */
  zoom?: boolean;
}) {
  const aspect = { "4/3": "aspect-[4/3]", "3/4": "aspect-[3/4]", "1/1": "aspect-square", "16/9": "aspect-video", "4/5": "aspect-[4/5]" }[ratio];
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
