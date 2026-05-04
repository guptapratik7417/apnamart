"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@/types";

type ProfilePayload = {
  user?: User | null;
  error?: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const response = await fetch("/api/auth/profile", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/login?redirect=/profile");
        return;
      }

      const payload = (await response.json()) as ProfilePayload;
      if (payload.user) {
        setUser(payload.user);
        setFullName(payload.user.full_name || "");
        setPhone(payload.user.phone || "");
      }
      setLoading(false);
    }

    void loadProfile();
  }, [router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName, phone }),
    });
    const payload = (await response.json()) as ProfilePayload;

    setSaving(false);

    if (!response.ok || !payload.user) {
      setError(payload.error || "Profile update failed.");
      return;
    }

    setUser(payload.user);
    router.push("/");
  }

  if (loading) {
    return (
      <main className="container-custom min-h-[calc(100vh-8rem)] py-12">
        <div className="rounded-lg bg-white p-8 shadow-sm">Loading profile...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Profile</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Keep your account details ready for faster checkout.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow-sm">
            {message && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Full name</span>
                <input
                  className="input"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Email</span>
                <input className="input bg-gray-50" value={user?.email || ""} disabled />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Phone</span>
                <input
                  className="input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary mt-6 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>

          <aside className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="font-semibold">Account</h2>
            <div className="mt-4 space-y-3 text-sm">
              <Link href="/orders" className="block text-[var(--color-primary)]">
                Order history
              </Link>
              <Link href="/privacy-policy" className="block text-[var(--color-primary)]">
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className="block text-[var(--color-primary)]">
                Terms and Conditions
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
