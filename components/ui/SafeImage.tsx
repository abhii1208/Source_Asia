"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SafeImageBaseProps = {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  fallbackGradient?: string;
  fallbackLabel?: string;
  unoptimized?: boolean;
};

type SafeImageFillProps = SafeImageBaseProps & {
  fill: true;
  width?: never;
  height?: never;
};

type SafeImageSizedProps = SafeImageBaseProps & {
  fill?: false;
  width: number;
  height: number;
};

export type SafeImageProps = SafeImageFillProps | SafeImageSizedProps;

export default function SafeImage({
  src,
  alt,
  className,
  imageClassName,
  sizes,
  priority = false,
  fallbackGradient = "from-teal-500 to-emerald-200",
  fallbackLabel,
  unoptimized = false,
  ...layoutProps
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  const label = fallbackLabel?.trim() || alt;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          sizes={sizes}
          priority={priority}
          unoptimized={unoptimized}
          className={cn("object-cover object-center", imageClassName)}
          onError={() => setHasError(true)}
          {...layoutProps}
        />
      ) : null}

      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-opacity",
          fallbackGradient,
          hasError ? "opacity-100" : "opacity-0"
        )}
      />

      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-white">
          <span className="material-symbols-outlined text-2xl">flight_takeoff</span>
          <span className="text-sm font-semibold">{label}</span>
        </div>
      ) : null}
    </div>
  );
}

