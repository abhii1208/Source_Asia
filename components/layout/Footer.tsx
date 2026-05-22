import Link from "next/link";

const footerLinks = [
  { href: "/search", label: "Search Flights" },
  { href: "/my-bookings", label: "My Bookings" },
  { href: "/auth/login", label: "Login" },
  { href: "/offline", label: "Offline Help" }
];

export default function Footer() {
  return (
    <footer className="w-full py-12 bg-[#d4d7e6] border-t border-outline-variant/30">
      <div className="max-w-[1600px] mx-auto px-gutter grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex flex-col gap-2">
          <Link href="/" className="focus-ring rounded-lg w-fit">
            <span className="font-headline-md text-headline-md text-primary italic">FlyAhead</span>
          </Link>
          <p className="font-body-md text-body-md text-on-surface-variant">
            (c) 2026 FlyAhead Aerospace. Effortless Velocity.
          </p>
          <p className="text-xs text-on-surface-variant">
            Built with Next.js, Supabase, Realtime, Zustand, and PWA support.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 md:justify-end">
          {footerLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-all hover:translate-x-1 duration-300 focus-ring rounded-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
