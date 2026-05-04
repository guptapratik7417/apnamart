"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SupportTicket, SupportTicketStatus } from "@/types";

const statuses: SupportTicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

export default function AdminSupportTickets({
  tickets,
}: {
  tickets: SupportTicket[];
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState("");

  async function update(
    ticket: SupportTicket,
    patch: { status?: SupportTicketStatus; admin_notes?: string | null }
  ) {
    setSavingId(ticket.id);
    const response = await fetch(`/api/admin/support/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSavingId("");

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Support ticket update failed");
      return;
    }

    router.refresh();
  }

  if (!tickets.length) {
    return (
      <div className="rounded-lg bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-semibold">No support tickets yet</h2>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <article key={ticket.id} className="rounded-lg bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif text-xl font-bold">{ticket.subject}</h2>
                <span className="rounded-full bg-pink-50 px-2 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {ticket.customer_name} · {ticket.customer_email}
                {ticket.phone ? ` · ${ticket.phone}` : ""}
                {ticket.order_number ? ` · ${ticket.order_number}` : ""}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">
                {ticket.message}
              </p>
            </div>

            <div className="min-w-44">
              <label className="block space-y-2">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Status
                </span>
                <select
                  className="input"
                  value={ticket.status}
                  disabled={savingId === ticket.id}
                  onChange={(event) =>
                    update(ticket, {
                      status: event.target.value as SupportTicketStatus,
                    })
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <Link
            href={`/admin/support/${ticket.id}`}
            className="mt-5 inline-flex rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white"
          >
            View Ticket
          </Link>

          {ticket.admin_notes && (
            <div className="mt-5 rounded-lg bg-amber-50 p-3 text-sm">
              <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Existing Private Note
              </p>
              <p className="mt-1 whitespace-pre-wrap">{ticket.admin_notes}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
