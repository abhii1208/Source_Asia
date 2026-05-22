import { cn } from "@/lib/utils";

type AirlineBadgeProps = {
  airline?: string;
  className?: string;
};

type AirlineVisual = {
  name: string;
  initials: string;
  tone: string;
};

const airlineVisualMap: Record<string, AirlineVisual> = {
  "Air India": {
    name: "Air India",
    initials: "AI",
    tone: "bg-rose-100 text-rose-700 border-rose-200"
  },
  IndiGo: {
    name: "IndiGo",
    initials: "6E",
    tone: "bg-indigo-100 text-indigo-700 border-indigo-200"
  },
  "Akasa Air": {
    name: "Akasa Air",
    initials: "QP",
    tone: "bg-orange-100 text-orange-700 border-orange-200"
  },
  Vistara: {
    name: "Vistara",
    initials: "UK",
    tone: "bg-violet-100 text-violet-700 border-violet-200"
  },
  SpiceJet: {
    name: "SpiceJet",
    initials: "SG",
    tone: "bg-red-100 text-red-700 border-red-200"
  },
  FlyAhead: {
    name: "FlyAhead",
    initials: "FA",
    tone: "bg-teal-100 text-teal-700 border-teal-200"
  }
};

function normalizeAirlineName(airline?: string): string {
  if (!airline) {
    return "FlyAhead";
  }
  if (airlineVisualMap[airline]) {
    return airline;
  }
  const trimmed = airline.trim();
  return trimmed.length > 0 ? trimmed : "FlyAhead";
}

function airlineInitials(airline: string): string {
  if (airlineVisualMap[airline]) {
    return airlineVisualMap[airline].initials;
  }

  const words = airline.split(" ").filter(Boolean);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}

export default function AirlineBadge({ airline, className }: AirlineBadgeProps) {
  const normalizedAirline = normalizeAirlineName(airline);
  const tone = airlineVisualMap[normalizedAirline]?.tone ?? "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs", tone, className)}>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/80 font-semibold text-[10px]">
        {airlineInitials(normalizedAirline)}
      </span>
      <span className="font-medium">{normalizedAirline}</span>
    </div>
  );
}

