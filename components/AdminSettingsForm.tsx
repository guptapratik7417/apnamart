"use client";

import { useState } from "react";
import type { SiteConfigRecord } from "@/config/app-properties";

export default function AdminSettingsForm({
  initialRecords,
}: {
  initialRecords: SiteConfigRecord[];
}) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      initialRecords.map((record) => [record.key, JSON.stringify(record.value, null, 2)])
    )
  );
  const [activeFlags, setActiveFlags] = useState(() =>
    Object.fromEntries(
      initialRecords.map((record) => [record.key, record.isActive !== false])
    )
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    let records: SiteConfigRecord[];
    try {
      records = initialRecords.map((record) => ({
        key: record.key,
        value: JSON.parse(values[record.key] || "{}") as unknown,
        isActive: activeFlags[record.key] !== false,
      }));
    } catch (parseError) {
      setSaving(false);
      setError(
        parseError instanceof Error
          ? `Config must be valid JSON. ${parseError.message}`
          : "Config must be valid JSON."
      );
      return;
    }

    const response = await fetch("/api/site-config/records", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });

    const payload = (await response.json()) as {
      records?: SiteConfigRecord[];
      error?: string;
    };

    setSaving(false);

    if (!response.ok || !payload.records) {
      setError(payload.error || "Settings update failed.");
      return;
    }

    setValues(
      Object.fromEntries(
        payload.records.map((record) => [
          record.key,
          JSON.stringify(record.value, null, 2),
        ])
      )
    );
    setActiveFlags(
      Object.fromEntries(
        payload.records.map((record) => [record.key, record.isActive !== false])
      )
    );
    setMessage("Settings saved.");
  }

  function reset() {
    setValues(
      Object.fromEntries(
        initialRecords.map((record) => [
          record.key,
          JSON.stringify(record.value, null, 2),
        ])
      )
    );
    setActiveFlags(
      Object.fromEntries(
        initialRecords.map((record) => [record.key, record.isActive !== false])
      )
    );
    setMessage("");
    setError("");
  }

  return (
    <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Feature Config Records</h2>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Each feature is saved as its own app_config record, so banner,
          navigation, footer, checkout, reviews, and catalog settings can change
          independently.
        </p>
      </div>

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

      <div className="space-y-5">
        {initialRecords.map((record) => (
          <section
            key={record.key}
            className="rounded-lg border border-[var(--color-border-light)] bg-gray-50 p-4"
          >
            <label className="block">
              <span className="mb-2 block font-mono text-sm font-semibold">
                {record.key}
              </span>
              <span className="mb-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                <span>
                  Created: {record.createdAt || "-"}
                </span>
                <span>
                  Updated: {record.updatedAt || "-"}
                </span>
                <span className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activeFlags[record.key] !== false}
                    onChange={(event) =>
                      setActiveFlags({
                        ...activeFlags,
                        [record.key]: event.target.checked,
                      })
                    }
                  />
                  Active
                </span>
              </span>
              <textarea
                className="input min-h-64 font-mono text-sm"
                value={values[record.key] || ""}
                onChange={(event) =>
                  setValues({ ...values, [record.key]: event.target.value })
                }
                spellCheck={false}
              />
            </label>
          </section>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
        <button type="button" className="btn-outline" onClick={reset} disabled={saving}>
          Reset
        </button>
      </div>
    </form>
  );
}
