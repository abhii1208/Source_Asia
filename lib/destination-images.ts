import type { AirportCode } from "@/lib/types";

export type DestinationImageMeta = {
  airportCode: AirportCode;
  cityName: string;
  imageSrc: string;
  imageAlt: string;
  highlightText: string;
  description: string;
  fallbackGradient: string;
};

export const destinationImages: Record<AirportCode, DestinationImageMeta> = {
  BLR: {
    airportCode: "BLR",
    cityName: "Bengaluru",
    imageSrc: "/images/destinations/bengaluru.jpg",
    imageAlt: "Bengaluru skyline and garden-city travel mood",
    highlightText: "Tech Capital Gateway",
    description: "Modern skyline, garden-city calm, and premium business travel rhythm.",
    fallbackGradient: "from-teal-500 to-cyan-200"
  },
  DEL: {
    airportCode: "DEL",
    cityName: "Delhi",
    imageSrc: "/images/destinations/delhi.jpg",
    imageAlt: "India Gate and Delhi city travel view",
    highlightText: "Heritage + Executive",
    description: "Historic landmarks and high-frequency premium travel corridors.",
    fallbackGradient: "from-teal-500 to-emerald-200"
  },
  BOM: {
    airportCode: "BOM",
    cityName: "Mumbai",
    imageSrc: "/images/destinations/mumbai.jpg",
    imageAlt: "Mumbai coastal skyline and travel city vibe",
    highlightText: "Coastal Metro Energy",
    description: "Marine Drive energy, skyline transitions, and nonstop commerce routes.",
    fallbackGradient: "from-cyan-600 to-sky-300"
  },
  HYD: {
    airportCode: "HYD",
    cityName: "Hyderabad",
    imageSrc: "/images/destinations/hyderabad.jpg",
    imageAlt: "Hyderabad heritage and modern tech district travel view",
    highlightText: "Heritage + HITEC",
    description: "Charminar roots with strong tech-city momentum for modern travel.",
    fallbackGradient: "from-teal-600 to-rose-200"
  },
  MAA: {
    airportCode: "MAA",
    cityName: "Chennai",
    imageSrc: "/images/destinations/chennai.jpg",
    imageAlt: "Chennai coastal sunrise and cultural travel route",
    highlightText: "Coastal Sunrise Hub",
    description: "Marina Beach calm and temple-lined cultural routes with steady demand.",
    fallbackGradient: "from-teal-500 to-amber-200"
  },
  CCU: {
    airportCode: "CCU",
    cityName: "Kolkata",
    imageSrc: "/images/destinations/kolkata.jpg",
    imageAlt: "Kolkata bridge skyline and cultural city travel mood",
    highlightText: "Cultural Corridor",
    description: "Howrah Bridge character and classic city depth for long-route travelers.",
    fallbackGradient: "from-emerald-600 to-violet-200"
  },
  GOI: {
    airportCode: "GOI",
    cityName: "Goa",
    imageSrc: "/images/destinations/goa.jpg",
    imageAlt: "Goa beach and sunset travel view with palm mood",
    highlightText: "Leisure Escape",
    description: "Palm coastlines and sunset routes for short-holiday premium breaks.",
    fallbackGradient: "from-emerald-500 to-orange-300"
  }
};

export function getDestinationImage(airportCode: AirportCode): DestinationImageMeta {
  return destinationImages[airportCode];
}

export function getAllDestinationImages(): DestinationImageMeta[] {
  return Object.values(destinationImages);
}

export const heroTravelImage = {
  src: "/images/destinations/hero-mountains.jpg",
  alt: "Premium mountain travel scene for FlyAhead hero section",
  fallbackGradient: "from-teal-700 via-teal-500 to-cyan-200"
} as const;

