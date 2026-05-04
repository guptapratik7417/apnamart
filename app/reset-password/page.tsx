"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type ResetPasswordPayload = {
  user?: unknown;
  error?: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const token = new URLSearchParams(window.location.search).get("token") || "";
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const payload = (await response.json()) as ResetPasswordPayload;

    if (!response.ok || !payload.user) {
      setError("Password reset failed. Please request a new reset link.");
      setLoading(false);
      return;
    }

    router.push("/cart");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="font-serif text-3xl font-bold text-[var(--color-secondary)]">
              Set new password
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Choose a new password for your account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="New password"
              minLength={6}
              required
            />
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm new password"
              minLength={6}
              required
            />
            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update password"}
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
