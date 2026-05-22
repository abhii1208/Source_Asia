import Link from "next/link";

export default function OfflinePage() {
  return (
    <section className="max-w-3xl mx-auto px-gutter py-14">
      <div className="glass-panel rounded-2xl p-8 md:p-10 shadow-glass text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary-container/15 text-primary flex items-center justify-center mb-5">
          <span className="material-symbols-outlined text-[42px]">wifi_off</span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface">You are offline</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mt-3">
          You&apos;re offline. Your last saved bookings are still available.
        </p>
        <p className="text-on-surface-variant mt-2">
          Reconnect to sync updates, confirm live status, and complete new bookings.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/my-bookings"
            className="rounded-xl bg-primary text-on-primary px-5 py-3 hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
          >
            Open My Bookings
          </Link>
          <Link
            href="/search"
            className="rounded-xl border border-primary text-primary px-5 py-3 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
          >
            Search Flights
          </Link>
        </div>
      </div>
    </section>
  );
}
