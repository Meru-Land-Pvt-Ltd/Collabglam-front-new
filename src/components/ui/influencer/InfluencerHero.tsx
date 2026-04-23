"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ✅ Put your exact filenames here (mix png/jpg is fine)
const HERO_IMAGES = [
  // "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image1.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image2.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image3.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image4.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image5.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image6.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image7.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image8.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image9.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image10.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image11.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image12.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image13.png",
  "https://collaglam-campaign.s3.us-east-1.amazonaws.com/image14.png",
];

const HERO_QUOTES = [
  "“Your influence has a voice, Let’s amplify it.”",
  "“Every creator starts somewhere”",
  "“Your story is still unfolding. Let’s shape it together”",
  "“Your creative world is waiting for you.”",
  "“Your content deserves the right collaborations.”",
  "“Turn your creativity into meaningful partnerships.”",
  "“Great creators don’t chase brands — the right brands find them.”",
  "“Every post you create is a step toward your next big collaboration.”",
  "“Your influence is more than numbers — it’s impact.”",
  "“Work with brands that truly match your style.”",
  "“The right campaign should feel like your content, not an ad.”",
  "“Get discovered for what makes your content unique.”",
  "“Your next brand collaboration could start today.”",
];

// ✅ Pair safely (prevents undefined quote)
const HERO_ITEMS = Array.from(
  { length: Math.min(HERO_IMAGES.length, HERO_QUOTES.length) },
  (_, i) => ({ src: HERO_IMAGES[i], quote: HERO_QUOTES[i] })
);

// ✅ Overlay styles
const SOLID_COLOR = "#FFBF00";
const GRADIENT = "linear-gradient(135deg, #FD9100 0%, #830002 100%)";

// ✅ Put the images that should be SOLID #FFBF00 here
const SOLID_OVERLAY_IMAGES = new Set<string>([
  "/images/influencer2.jpg",
  "/images/influencer4.jpg",
  "/images/influencer6.jpg",
  "/images/influencer8.png",
  // add/remove filenames as you want
]);

function pickRandomIndex(max: number) {
  return Math.floor(Math.random() * max);
}

export function InfluencerHero({
  className,
  imageClassName,
}: {
  className?: string;
  imageClassName?: string;
}) {
  // ✅ Hydration-safe: decide randomness only after mount
  const [mounted, setMounted] = React.useState(false);
  const [idx, setIdx] = React.useState<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
    setIdx(pickRandomIndex(HERO_ITEMS.length));
  }, []);

  // ✅ Server render + first client render match
  if (!mounted || idx === null) {
    return <div className={cn("relative w-full overflow-hidden", className)} />;
  }

  const item = HERO_ITEMS[idx];
  const isSolid = SOLID_OVERLAY_IMAGES.has(item.src);

  return (
    <div
      className={cn("relative w-full overflow-hidden", className)}
      style={{ isolation: "isolate" }}
    >
      {/* ✅ Grayscale image */}
      <img
        src={item.src}
        alt="Influencer hero"
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-center z-0",
          "grayscale",
          imageClassName
        )}
        loading="eager"
      />

      {/* ✅ Updated overlay (more effective with grayscale)
          - Using mixBlendMode: "color" makes tint pop even on grayscale
          - Higher opacity + slight saturation/contrast boost */}
      <div
        className="absolute inset-0 z-[5] pointer-events-none"
        style={{
          background: isSolid ? SOLID_COLOR : GRADIENT,
          opacity: 0.65, // stronger tint
          mixBlendMode: "color", // ✅ best for grayscale tinting (try "soft-light" if needed)
          filter: "saturate(170%) contrast(1.05)",
        }}
      />

      {/* ✅ Optional: lighter dark gradient for contrast (reduced so it doesn't kill the tint) */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/0 via-black/0 to-black/25" />

      {/* ✅ Quote area with SAME blur + fade mask style */}
      <div className="absolute z-20 left-0 right-0 bottom-0 flex justify-center">
        <div className="relative w-full h-[150px] flex items-center justify-center px-[28px] overflow-hidden">
          {/* blur glass layer */}
          <div
            className="absolute inset-0"
            style={{
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              maskImage: "linear-gradient(to top, black 0%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to top, black 0%, transparent 100%)",
            }}
          />
          {/* quote */}
          <p className="relative text-center text-white font-semibold text-[22px] sm:text-[26px] leading-snug z-10 drop-shadow">
            {item.quote}
          </p>
        </div>
      </div>
    </div>
  );
}
