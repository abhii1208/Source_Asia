"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { resetUserStore, setSession } from "@/store/useUserStore";
import { useFlightStore } from "@/store/useFlightStore";
import { createSupabaseBrowserClient, getSupabaseBrowserClientError } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/search",
    label: "Search",
    isActive: (pathname) =>
      pathname === "/" ||
      pathname === "/search" ||
      pathname.startsWith("/flights") ||
      pathname.startsWith("/booking")
  },
  {
    href: "/my-bookings",
    label: "Trips",
    isActive: (pathname) => pathname.startsWith("/my-bookings")
  },
  {
    href: "/auth/login",
    label: "Profile",
    isActive: (pathname) => pathname.startsWith("/auth")
  },
  {
    href: "/offline",
    label: "Help",
    isActive: (pathname) => pathname.startsWith("/offline")
  }
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const profileInitials = useMemo(() => {
    if (!userEmail) {
      return "AM";
    }
    const [name] = userEmail.split("@");
    return name.slice(0, 2).toUpperCase();
  }, [userEmail]);

  useEffect(() => {
    const envError = getSupabaseBrowserClientError();
    if (envError) {
      setAuthError(envError);
      setIsLoadingUser(false);
      setUserEmail(null);
      resetUserStore();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setAuthError("Supabase client is not available. Check environment variables.");
      setIsLoadingUser(false);
      return;
    }

    let isMounted = true;
    setAuthError(null);

    void Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]).then(([{ data }, { data: sessionData }]) => {
      if (!isMounted) {
        return;
      }
      const nextEmail = data.user?.email ?? null;
      const sessionToken = sessionData.session?.access_token ?? null;
      setUserEmail(nextEmail);
      if (data.user?.id && nextEmail) {
        setSession(data.user.id, nextEmail, sessionToken);
      } else {
        resetUserStore();
      }
      setIsLoadingUser(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextEmail = session?.user.email ?? null;
      setUserEmail(nextEmail);
      if (session?.user.id && nextEmail) {
        setSession(session.user.id, nextEmail, session.access_token ?? null);
      } else {
        resetUserStore();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setAuthError("Supabase client is not available. Check environment variables.");
      return;
    }

    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError("Could not log out right now. Please try again.");
      setIsSigningOut(false);
      return;
    }

    useFlightStore.getState().resetAll();
    resetUserStore();
    setUserEmail(null);
    setIsSigningOut(false);
    router.replace("/auth/login");
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-white/20 shadow-soft">
      <div className="mx-auto max-w-[1600px] px-gutter py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 focus-ring rounded-lg">
          <span className="material-symbols-outlined text-primary text-[30px]">flight_takeoff</span>
          <span className="font-headline-lg text-headline-lg tracking-tighter text-primary italic leading-none">
            AeroMint
          </span>
        </Link>

        <nav className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => {
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "font-label-caps text-label-caps transition-colors duration-300 pb-1 border-b-2 focus-ring rounded-sm",
                  active
                    ? "text-primary border-primary font-bold"
                    : "text-on-surface-variant border-transparent hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {userEmail ? (
          <div className="flex items-center gap-3">
            <div
              aria-label="User account"
              className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-semibold border border-primary/10"
            >
              {profileInitials}
            </div>
            <div className="hidden md:block">
              <p className="text-on-surface text-sm leading-tight">{userEmail}</p>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="text-primary hover:underline text-sm focus-ring rounded-sm"
              >
                {isSigningOut ? "Logging out..." : "Logout"}
              </button>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="md:hidden rounded-xl border border-primary text-primary px-3 py-2 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
            >
              {isSigningOut ? "..." : "Logout"}
            </button>
          </div>
        ) : (
          <Link
            href="/auth/login"
            aria-label="Open login page"
            className="rounded-xl border border-primary text-primary px-4 py-2 hover:bg-primary hover:text-on-primary transition-colors focus-ring"
          >
            {isLoadingUser ? "..." : "Login"}
          </Link>
        )}
      </div>
      {authError ? <p className="px-gutter pb-2 text-sm text-error">{authError}</p> : null}
    </header>
  );
}
