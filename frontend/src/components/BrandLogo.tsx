import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoSize = "xs" | "sm" | "md" | "lg";

/**
 * Landscape logo (1536×1024) has ~25–30% empty dark padding + glow baked into the PNG.
 * We size by WIDTH (not height) and scale up so the actual artwork fills the frame.
 */
const SIZE: Record<LogoSize, { width: string; scale: string; clip: string }> = {
  xs: { width: "w-[170px]", scale: "scale-[1.25]", clip: "h-[72px]" },
  sm: { width: "w-[200px]", scale: "scale-[1.3]", clip: "h-[85px]" },
  md: { width: "w-[230px]", scale: "scale-[1.35]", clip: "h-[100px]" },
  lg: { width: "w-[280px]", scale: "scale-[1.35]", clip: "h-[120px]" },
};

/** ~70% of full clip heights — tuned for public navbar */
const CLIP_COMPACT: Record<LogoSize, string> = {
  xs: "h-[50px]",
  sm: "h-[60px]",
  md: "h-[70px]",
  lg: "h-[84px]",
};

type BrandLogoProps = {
  className?: string;
  size?: LogoSize;
  priority?: boolean;
  framed?: boolean;
  /** Shorter clip for navbars / sidebars */
  compact?: boolean;
};

export function BrandLogo({
  className,
  size = "md",
  priority = false,
  framed = false,
  compact = false,
}: BrandLogoProps) {
  const { width, scale, clip } = SIZE[size];
  const clipClass = compact ? CLIP_COMPACT[size] : clip;

  const image = (
    <Image
      src="/logo.png"
      alt="Luv Kush Coaching Center"
      width={1536}
      height={1024}
      priority={priority}
      className={cn("h-auto max-w-full shrink-0 origin-center object-contain -translate-y-[15px]", width, scale)}
    />
  );

  if (!framed) {
    return <div className={cn("inline-flex overflow-visible", className)}>{image}</div>;
  }

  return (
    <div
      className={cn(
        "inline-flex w-full max-w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-card px-[5px]",
        compact ? "py-0" : "py-1",
        className
      )}
    >
      <div className={cn("flex w-full items-center justify-center overflow-hidden", clipClass)}>
        {image}
      </div>
    </div>
  );
}