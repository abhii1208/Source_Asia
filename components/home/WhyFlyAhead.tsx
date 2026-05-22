import AnimatedCard from "@/components/ui/AnimatedCard";

const highlights = [
  {
    icon: "event_seat",
    title: "Live Seat Map",
    text: "Seat availability syncs in realtime so travelers avoid stale selections during checkout."
  },
  {
    icon: "verified_user",
    title: "Secure Booking",
    text: "Supabase Auth protects account routes while server-side booking APIs keep ticket actions trusted."
  },
  {
    icon: "sync_alt",
    title: "Smart Reschedule",
    text: "Route-safe rescheduling and clear cancellation rules reduce confusion for post-booking updates."
  },
  {
    icon: "print",
    title: "Print & Email Ticket",
    text: "Confirmation pages support clean ticket printing and optional registered-email delivery."
  }
];

export default function WhyFlyAhead() {
  return (
    <section className="py-section-gap">
      <div className="text-center">
        <h2 className="font-headline-lg text-headline-lg text-on-background">Why FlyAhead</h2>
        <p className="text-on-surface-variant mt-2 max-w-2xl mx-auto">
          Built for assignment reliability with production-minded flows, stable edge handling, and premium presentation.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {highlights.map((feature, index) => (
          <AnimatedCard key={feature.title} delay={index * 0.05}>
            <article className="glass-panel rounded-2xl border border-white/35 p-5 h-full">
              <div className="h-11 w-11 rounded-full bg-primary-container/20 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined">{feature.icon}</span>
              </div>
              <h3 className="font-headline-md text-headline-md mt-4">{feature.title}</h3>
              <p className="text-sm text-on-surface-variant mt-2">{feature.text}</p>
            </article>
          </AnimatedCard>
        ))}
      </div>
    </section>
  );
}

