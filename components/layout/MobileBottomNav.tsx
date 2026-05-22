"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type BottomLink = {
  href: string;
  label: string;
  icon: string;
  isActive: (pathname: string) => boolean;
};

const links: BottomLink[] = [
  {
    href: "/search",
    label: "Search",
    icon: "search",
    isActive: (pathname) =>
      pathname === "/" ||
      pathname === "/search" ||
      pathname.startsWith("/flights") ||
      pathname.startsWith("/booking")
  },
  {
    href: "/my-bookings",
    label: "Trips",
    icon: "luggage",
    isActive: (pathname) => pathname.startsWith("/my-bookings")
  },
  {
    href: "/auth/login",
    label: "Profile",
    icon: "person_pin",
    isActive: (pathname) => pathname.startsWith("/auth")
  },
  {
    href: "/offline",
    label: "Help",
    icon: "support_agent",
    isActive: (pathname) => pathname.startsWith("/offline")
  }
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 rounded-t-xl md:hidden z-50 bg-surface/90 backdrop-blur-xl border-t border-white/20 shadow-[0_-10px_25px_-5px_rgba(15,23,42,0.1)] flex justify-around items-center h-16">
      {links.map((link) => {
        const active = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center rounded-full px-4 py-1 scale-90 duration-200 focus-ring",
              active
                ? "bg-primary-container text-on-primary-container"
                : "text-on-surface-variant hover:text-primary"
            )}
          >
            <span className="material-symbols-outlined text-[24px]">{link.icon}</span>
            <span className={cn("font-label-caps text-label-caps mt-1", active ? "hidden" : "inline")}>
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

