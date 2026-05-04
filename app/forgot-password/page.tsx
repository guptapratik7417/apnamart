"use client";

import Link from "next/link";
import { useState } from "react";
import { useSiteConfig } from "@/lib/use-site-config";

type ForgotPasswordPayload = {
  message?: string;
  error?: string;
};

export default function ForgotPasswordPage() {
  const config = useSiteConfig();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const text = await response.text();
    const payload = text ? (JSON.parse(text) as ForgotPasswordPayload) : {};

    if (!response.ok) {
      setMessage("Password reset email could not be sent. Please try again later.");
    } else {
      setMessage(
        payload.message || "If an account exists, reset instructions are available."
      );
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-3xl font-bold text-[var(--color-secondary)]">
              Reset password
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Enter your {config.storeName} account email.
            </p>
          </div>

          {message && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <p>{message}</p>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <input
              className="input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              required
            />
            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-6 block text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
