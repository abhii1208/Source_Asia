import type { AirportCode } from "@/lib/types";

export type DestinationImageMeta = {
  airportCode: AirportCode;
  cityName: string;
  imageSrc: string;
  imageAlt: string;
  highlightText: string;
  description: string;
};

const destinationImages: Record<AirportCode, DestinationImageMeta> = {
  BLR: {
    airportCode: "BLR",
    cityName: "Bengaluru",
    imageSrc: "/images/destinations/blr.svg",
    imageAlt: "Bengaluru destination visual with skyline and garden-city travel mood",
    highlightText: "Tech Capital Gateway",
    description: "Modern skyline, garden-city calm, and premium business travel rhythm."
  },
  DEL: {
    airportCode: "DEL",
    cityName: "Delhi",
    imageSrc: "/images/destinations/del.svg",
    imageAlt: "Delhi destination visual inspired by India Gate and heritage city landscape",
    highlightText: "Heritage + Executive",
    description: "Historic landmarks and high-frequency premium travel corridors."
  },
  BOM: {
    airportCode: "BOM",
    cityName: "Mumbai",
    imageSrc: "/images/destinations/bom.svg",
    imageAlt: "Mumbai destination visual with coastal skyline and premium city movement",
    highlightText: "Coastal Metro Energy",
    description: "Marine Drive energy, skyline transitions, and nonstop commerce routes."
  },
  HYD: {
    airportCode: "HYD",
    cityName: "Hyderabad",
    imageSrc: "/images/destinations/hyd.svg",
    imageAlt: "Hyderabad destination visual balancing Charminar heritage and modern tech district",
    highlightText: "Heritage + HITEC",
    description: "Charminar roots with strong tech-city momentum for modern travel."
  },
  MAA: {
    airportCode: "MAA",
    cityName: "Chennai",
    imageSrc: "/images/destinations/maa.svg",
    imageAlt: "Chennai destination visual inspired by Marina Beach and coastal sunrise travel",
    highlightText: "Coastal Sunrise Hub",
    description: "Marina Beach calm and temple-lined cultural routes with steady demand."
  },
  CCU: {
    airportCode: "CCU",
    cityName: "Kolkata",
    imageSrc: "/images/destinations/ccu.svg",
    imageAlt: "Kolkata destination visual with bridge-inspired lines and cultural city atmosphere",
    highlightText: "Cultural Corridor",
    description: "Howrah Bridge character and classic city depth for long-route travelers."
  },
  GOI: {
    airportCode: "GOI",
    cityName: "Goa",
    imageSrc: "/images/destinations/goi.svg",
    imageAlt: "Goa destination visual with beach sunset, palms, and relaxed premium travel theme",
    highlightText: "Leisure Escape",
    description: "Palm coastlines and sunset routes for short-holiday premium breaks."
  }
};

export function getDestinationImage(airportCode: AirportCode): DestinationImageMeta {
  return destinationImages[airportCode];
}

export function getAllDestinationImages(): DestinationImageMeta[] {
  return Object.values(destinationImages);
}

