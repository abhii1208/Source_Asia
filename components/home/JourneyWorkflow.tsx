import AnimatedCard from "@/components/ui/AnimatedCard";

const journeySteps = [
  {
    step: "01",
    icon: "search",
    title: "Search Flights",
    text: "Use route chips, flexible date inputs, and cabin filters to find suitable options quickly."
  },
  {
    step: "02",
    icon: "airline_seat_recline_normal",
    title: "Choose Seat",
    text: "Select seats from visual cabin maps with realtime occupancy and fare-aware seat pricing."
  },
  {
    step: "03",
    icon: "confirmation_number",
    title: "Confirm Ticket",
    text: "Book with atomic seat reservation and receive PNR confirmation in a printable ticket view."
  },
  {
    step: "04",
    icon: "manage_history",
    title: "Manage Booking",
    text: "Print anytime, reschedule smartly, or cancel within rule windows from My Bookings."
  }
];

export default function JourneyWorkflow() {
  return (
    <section className="py-section-gap">
      <div className="glass-panel rounded-2xl border border-white/35 p-6 md:p-8">
        <h2 className="font-headline-lg text-headline-lg text-on-background">Journey Workflow</h2>
        <p className="text-on-surface-variant mt-2 max-w-3xl">
          Every step is designed to keep users out of dead ends: clear validation, stable booking actions, and post-trip controls.
        </p>

        <div className="mt-7 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {journeySteps.map((item, index) => (
            <AnimatedCard key={item.step} delay={index * 0.06}>
              <article className="relative rounded-xl border border-outline-variant/35 bg-surface-container-lowest p-4 h-full">
                <span className="absolute top-3 right-3 text-xs text-primary font-semibold">{item.step}</span>
                <div className="h-10 w-10 rounded-full bg-primary-container/15 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <h3 className="font-headline-md text-headline-md mt-3">{item.title}</h3>
                <p className="text-sm text-on-surface-variant mt-2">{item.text}</p>
              </article>
            </AnimatedCard>
          ))}
        </div>

        <div className="mt-6 hidden xl:grid grid-cols-4 gap-4 pointer-events-none" aria-hidden>
          {journeySteps.map((item, index) => (
            <div key={item.step} className="relative h-2">
              {index < journeySteps.length - 1 ? (
                <span className="absolute inset-y-0 left-1/2 right-[-50%] bg-gradient-to-r from-primary/45 to-primary/0 rounded-full" />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

