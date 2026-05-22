"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, getSupabaseBrowserClientError } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/validators";
import { setSession } from "@/store/useUserStore";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function mapSignupError(message: string): string {
    if (message.toLowerCase().includes("already registered")) {
      return "An account with this email already exists. Please log in.";
    }
    if (message.toLowerCase().includes("password")) {
      return "Please choose a stronger password and try again.";
    }
    return "Could not create your account right now. Please try again.";
  }

  async function submitRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please provide a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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
    setSuccessMessage("");

    const { data, error: signupError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim()
        }
      }
    });

    if (signupError) {
      setError(mapSignupError(signupError.message));
      setIsSubmitting(false);
      return;
    }

    if (data.session && data.user?.id && data.user.email) {
      setSession(data.user.id, data.user.email);
      router.replace("/search");
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage("Account created. Please check your email to confirm your account.");
    setIsSubmitting(false);
  }

  return (
    <section className="min-h-[calc(100vh-220px)] flex items-center justify-center px-gutter py-12">
      <form onSubmit={submitRegister} className="glass-panel rounded-2xl p-8 w-full max-w-md shadow-glass">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Create Account</h1>
        <p className="text-on-surface-variant mt-2">Set up your AeroMint profile to book and manage flights.</p>

        <label className="block mt-6">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Full Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
            className="w-full mt-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary/30"
            placeholder="John Doe"
            autoComplete="name"
          />
        </label>

        <label className="block mt-4">
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
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
          />
        </label>

        <label className="block mt-4">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Confirm Password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={isSubmitting}
            className="w-full mt-1 rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 focus:ring-2 focus:ring-primary/30"
            placeholder="Re-enter password"
            autoComplete="new-password"
          />
        </label>

        {error ? <p className="text-error text-sm mt-3">{error}</p> : null}
        {successMessage ? <p className="text-primary text-sm mt-3">{successMessage}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 rounded-xl bg-primary text-on-primary py-3 font-headline-md text-headline-md hover:bg-primary-container hover:text-on-primary-container transition-colors focus-ring"
        >
          {isSubmitting ? "Creating Account..." : "Create Account"}
        </button>

        <p className="text-on-surface-variant mt-4 text-center">
          Already registered?{" "}
          <Link href="/auth/login" className="text-primary hover:underline focus-ring rounded-sm">
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}

