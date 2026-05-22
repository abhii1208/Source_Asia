const features = [
  {
    icon: "event_seat",
    title: "Realtime Seat Selection",
    text: "Seat availability updates live, so you never confirm a stale seat."
  },
  {
    icon: "verified_user",
    title: "Secure Supabase Auth",
    text: "Email/password authentication with protected booking and trip routes."
  },
  {
    icon: "confirmation_number",
    title: "Instant PNR",
    text: "Booking confirmation is generated immediately for every successful reservation."
  },
  {
    icon: "sync_alt",
    title: "Easy Reschedule & Cancel",
    text: "Manage your booking lifecycle with clear rules and friendly status feedback."
  }
];

const journey = [
  {
    step: "1",
    title: "Search",
    text: "Pick route, date, and passenger count with clear fare comparisons."
  },
  {
    step: "2",
    title: "Select",
    text: "Choose your preferred flight and seat from a visual cabin layout."
  },
  {
    step: "3",
    title: "Confirm",
    text: "Complete booking and receive your PNR and full trip details."
  },
  {
    step: "4",
    title: "Manage",
    text: "Track, reschedule, or cancel from My Bookings anytime."
  }
];

const stats = [
  { value: "8+", label: "Seeded Flights" },
  { value: "4", label: "Major Routes" },
  { value: "Live", label: "Seat Map" },
  { value: "PWA", label: "Offline Access" }
];

export default function FeatureGrid() {
  return (
    <section className="py-section-gap px-gutter bg-surface-container-low">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-4">Why FlyAhead</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            A production-focused assignment build with realtime seats, secure auth, and full booking management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="glass-panel p-card-padding rounded-2xl flex flex-col items-start text-left border border-white/35"
            >
              <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-4 text-primary">
                <span className="material-symbols-outlined text-[32px]">{feature.icon}</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2">{feature.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{feature.text}</p>
            </article>
          ))}
        </div>

        <div className="glass-panel rounded-2xl p-6 md:p-8 shadow-glass border border-white/35">
          <h3 className="font-headline-lg text-headline-lg text-on-background">Your journey, managed end-to-end</h3>
          <p className="text-on-surface-variant mt-2 max-w-3xl">
            Search, seat selection, booking, and post-booking updates are designed as one consistent flow.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {journey.map((item) => (
              <article key={item.step} className="rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-container/20 text-primary text-sm font-semibold">
                  {item.step}
                </span>
                <h4 className="font-headline-md text-headline-md mt-3">{item.title}</h4>
                <p className="text-sm text-on-surface-variant mt-2">{item.text}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((card) => (
            <article key={card.label} className="glass-panel rounded-xl p-5 text-center border border-white/35">
              <p className="font-headline-lg text-headline-lg text-primary">{card.value}</p>
              <p className="text-on-surface-variant text-sm mt-1">{card.label}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
