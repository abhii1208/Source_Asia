"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, getSupabaseBrowserClientError } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validators";
import { setSession } from "@/store/useUserStore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function mapLoginError(message: string): string {
    if (message.toLowerCase().includes("invalid login credentials")) {
      return "Incorrect email or password. Please try again.";
    }
    if (message.toLowerCase().includes("email not confirmed")) {
      return "Please confirm your email before logging in.";
    }
    return "Could not sign in right now. Please try again.";
  }

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidEmail(email) || password.length < 6) {
      setError("Enter a valid email and password (min 6 characters).");
      return;
    }

    const envError = getSupabaseBrowserClientError();
    if (envError) {
      setError(envError);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase client is not available. Check environment variables.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (authError) {
      setError(mapLoginError(authError.message));
      setIsSubmitting(false);
      return;
    }

    if (data.user?.id && data.user.email) {
      setSession(data.user.id, data.user.email);
    }

    const redirectTo =
      typeof window !== "undefined"
        ? new URL(window.location.href).searchParams.get("redirect") || "/search"
        : "/search";

    router.replace(redirectTo);
    setIsSubmitting(false);
  }

  return (
    <section className="min-h-[calc(100vh-220px)] flex items-center justify-center px-gutter py-12">
      <form onSubmit={submitLogin} className="glass-panel rounded-2xl p-8 w-full max-w-md shadow-glass">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Welcome Back</h1>
        <p className="text-on-surface-variant mt-2">Sign in to manage your trips and seat preferences.</p>

        <label className="block mt-6">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isSubmitting}
            className="w-full mt-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary/30"
            placeholder="name@example.com"
            autoComplete="email"
          />
        </label>

        <label className="block mt-4">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
            className="w-full mt-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary/30"
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </label>

        {error ? <p className="text-error text-sm mt-3">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 rounded-xl bg-primary text-on-primary py-3 font-headline-md text-headline-md hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        <p className="text-on-surface-variant mt-4 text-center">
          New to AeroMint?{" "}
          <Link href="/auth/register" className="text-primary hover:underline focus-ring rounded-sm">
            Create account
          </Link>
        </p>
      </form>
    </section>
  );
}

