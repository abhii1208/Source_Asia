import Link from "next/link";

const routeCards = [
  {
    route: "BLR to DEL",
    origin: "BLR",
    destination: "DEL",
    description: "Fast weekday corridor for founders and operators.",
    fareHint: "From INR 6,200"
  },
  {
    route: "DEL to BOM",
    origin: "DEL",
    destination: "BOM",
    description: "High-frequency metro route for business travel.",
    fareHint: "From INR 4,500"
  },
  {
    route: "HYD to MAA",
    origin: "HYD",
    destination: "MAA",
    description: "Short-haul route with efficient same-day options.",
    fareHint: "From INR 4,800"
  },
  {
    route: "CCU to BLR",
    origin: "CCU",
    destination: "BLR",
    description: "Premium cross-metro route with balanced timings.",
    fareHint: "From INR 7,400"
  }
];

const sampleDate = "2026-10-15";

export default function TrendingRoutes() {
  return (
    <section className="py-section-gap px-gutter max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">Popular Indian Routes</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Search from seeded live routes used by the booking flow.
          </p>
        </div>
        <Link
          href="/search"
          className="rounded-xl border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-colors focus-ring w-fit"
        >
          Explore All Routes
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {routeCards.map((card) => {
          const query = new URLSearchParams({
            origin: card.origin,
            destination: card.destination,
            date: sampleDate,
            passengers: "1",
            class: "economy"
          }).toString();

          return (
            <article
              key={card.route}
              className="glass-panel rounded-2xl p-6 shadow-glass border border-white/35 transition-transform hover:-translate-y-1"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-background">{card.route}</h3>
                  <p className="text-on-surface-variant mt-2">{card.description}</p>
                </div>
                <span className="rounded-full bg-primary-container/20 text-primary px-3 py-1 text-xs font-label-caps">
                  {card.fareHint}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <p className="text-sm text-on-surface-variant">Realtime seats available</p>
                <Link
                  href={`/flights?${query}`}
                  className="inline-flex items-center gap-1 text-primary hover:underline focus-ring rounded-sm"
                >
                  Search route
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
