"use client";

import type { AirportCode } from "@/lib/types";
import { getDestinationImage } from "@/lib/destination-images";
import { cn } from "@/lib/utils";
import SafeImage from "@/components/ui/SafeImage";

type DestinationImageProps = {
  airportCode: AirportCode;
  className?: string;
  sizes?: string;
  priority?: boolean;
  showLabel?: boolean;
};

export default function DestinationImage({
  airportCode,
  className,
  sizes = "(max-width: 768px) 100vw, 420px",
  priority = false,
  showLabel = false
}: DestinationImageProps) {
  const destination = getDestinationImage(airportCode);

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <SafeImage
        src={destination.imageSrc}
        alt={destination.imageAlt}
        fill
        sizes={sizes}
        priority={priority}
        fallbackGradient={destination.fallbackGradient}
        fallbackLabel={`${destination.airportCode} - ${destination.cityName}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      {showLabel ? (
        <div className="absolute left-3 bottom-3 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs text-white backdrop-blur-sm">
          {destination.highlightText}
        </div>
      ) : null}
    </div>
  );
}


