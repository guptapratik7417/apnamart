"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  refreshCartFromServer,
} from "@/lib/cart-client";
import { useSiteConfig } from "@/lib/use-site-config";
import type { User } from "@/types";

type AuthMode = "login" | "register";

type AuthPayload = {
  user?: User;
  error?: string;
};

export default function CustomerLoginPage() {
  const router = useRouter();
  const config = useSiteConfig();
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch(
      mode === "login" ? "/api/auth/login" : "/api/auth/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone,
        }),
      }
    );
    const payload = (await response.json()) as AuthPayload;

    if (!response.ok || !payload.user) {
      setError(
        mode === "login"
          ? "Login failed. Please check your details and try again."
          : "Registration failed. Please check your details and try again."
      );
      setLoading(false);
      return;
    }

    await refreshCartFromServer();

    router.push(new URLSearchParams(window.location.search).get("redirect") || "/cart");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-3xl font-bold text-[var(--color-secondary)]">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Sign in before adding products to your {config.storeName} cart.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-lg border border-[var(--color-border)] p-1">
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                mode === "login"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)]"
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                mode === "register"
                  ? "bg-[var(--color-primary)] text-white"
                  : "text-[var(--color-text-secondary)]"
              }`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <>
                <input
                  className="input"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Full name"
                  required
                />
                <input
                  className="input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Phone"
                />
              </>
            )}
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              minLength={6}
              required
            />
            {mode === "login" && (
              <Link
                href="/forgot-password"
                className="block text-right text-sm font-medium text-[var(--color-primary)] hover:underline"
              >
                Forgot password?
              </Link>
            )}
            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-60"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <Link
            href="/products"
            className="mt-6 block text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
