import Image from "next/image";
import { cn } from "@/lib/utils";

/** Responsive photo with consistent rounded framing. */
export function Photo({
  src,
  alt,
  className,
  ratio = "4/3",
  priority,
  sizes = "(min-width: 1024px) 50vw, 100vw",
}: {
  src: string;
  alt: string;
  className?: string;
  ratio?: "4/3" | "3/4" | "1/1" | "16/9" | "4/5";
  priority?: boolean;
  sizes?: string;
}) {
  const aspect = { "4/3": "aspect-[4/3]", "3/4": "aspect-[3/4]", "1/1": "aspect-square", "16/9": "aspect-video", "4/5": "aspect-[4/5]" }[ratio];
  return (
    <div className={cn("relative overflow-hidden rounded-3xl bg-brand-50", aspect, className)}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    </div>
  );
}
