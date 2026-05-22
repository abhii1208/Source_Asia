"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { AirportCode } from "@/lib/types";
import { getDestinationImage } from "@/lib/destination-images";
import { cn } from "@/lib/utils";

type DestinationImageProps = {
  airportCode: AirportCode;
  className?: string;
  sizes?: string;
  priority?: boolean;
  showLabel?: boolean;
};

const fallbackGradients: Record<AirportCode, string> = {
  BLR: "from-[#0f766e] via-[#14b8a6] to-[#67e8f9]",
  DEL: "from-[#0b7a75] via-[#2dd4bf] to-[#facc15]",
  BOM: "from-[#0b7285] via-[#14b8a6] to-[#60a5fa]",
  HYD: "from-[#0f766e] via-[#0ea5a3] to-[#fb7185]",
  MAA: "from-[#0d9488] via-[#2dd4bf] to-[#f59e0b]",
  CCU: "from-[#115e59] via-[#14b8a6] to-[#c084fc]",
  GOI: "from-[#0d9488] via-[#34d399] to-[#f97316]"
};

export default function DestinationImage({
  airportCode,
  className,
  sizes = "(max-width: 768px) 100vw, 420px",
  priority = false,
  showLabel = false
}: DestinationImageProps) {
  const destination = getDestinationImage(airportCode);
  const [loadFailed, setLoadFailed] = useState(false);
  const initials = useMemo(() => destination.cityName.slice(0, 2).toUpperCase(), [destination.cityName]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      {!loadFailed ? (
        <Image
          src={destination.imageSrc}
          alt={destination.imageAlt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover object-center"
          onError={() => setLoadFailed(true)}
        />
      ) : null}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          fallbackGradients[airportCode],
          loadFailed ? "opacity-100" : "opacity-15"
        )}
      />
      {loadFailed ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/95">
          <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
          <span className="text-xl font-semibold tracking-wider">{initials}</span>
        </div>
      ) : null}
      {showLabel ? (
        <div className="absolute left-3 bottom-3 rounded-full border border-white/40 bg-black/25 px-3 py-1 text-xs text-white backdrop-blur-sm">
          {destination.highlightText}
        </div>
      ) : null}
    </div>
  );
}

