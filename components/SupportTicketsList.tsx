"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import InlineIcon from "@/components/InlineIcon";
import type { SupportTicket } from "@/types";

const tabs = [
  { value: "all", label: "All Tickets" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

function formatDate(value?: string) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function getStatusClass(status: SupportTicket["status"]) {
  if (status === "resolved" || status === "closed") return "status-success";
  if (status === "open") return "status-warning";
  return "status-active";
}

export default function SupportTicketsList({
  tickets,
}: {
  tickets: SupportTicket[];
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["value"]>("all");
  const counts = useMemo(
    () =>
      tickets.reduce<Record<string, number>>(
        (acc, ticket) => {
          acc.all += 1;
          acc[ticket.status] = (acc[ticket.status] || 0) + 1;
          return acc;
        },
        { all: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 }
      ),
    [tickets]
  );
  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesTab = activeTab === "all" || ticket.status === activeTab;
      const matchesQuery =
        !normalizedQuery ||
        [
          ticket.id,
          ticket.subject,
          ticket.message,
          ticket.order_number || "",
          ticket.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesTab && matchesQuery;
    });
  }, [activeTab, query, tickets]);
  const searchSuggestions = useMemo(
    () =>
      Array.from(
        new Set(
          tickets.flatMap((ticket) => [
            ticket.subject,
            ticket.order_number || "",
            ticket.status.replace("_", " "),
            `#${ticket.id.slice(0, 8).toUpperCase()}`,
          ])
        )
      ).filter(Boolean),
    [tickets]
  );

  return (
    <section className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-center">
        <label className="relative block">
          <span className="sr-only">Search tickets</span>
          <input
            list="ticket-search-suggestions"
            className="input pl-4"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ticket, subject, order, or status"
          />
          <datalist id="ticket-search-suggestions">
            {searchSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </label>
        <Link
          href="#raise-ticket"
          className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 text-sm"
        >
          <InlineIcon name="plus" className="h-4 w-4" />
          Create New Ticket
        </Link>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--color-primary)]">
            Ticket History
          </p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
            Your Tickets
          </h2>
        </div>
        <span className="w-fit rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
          {tickets.length} open record{tickets.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.value
                ? "bg-pink-50 text-[var(--color-primary)]"
                : "border border-pink-100 bg-white text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            }`}
          >
            {tab.label} ({counts[tab.value] || 0})
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl border border-pink-100 bg-white">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
            No tickets found.
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full table-fixed border-collapse text-sm">
                <colgroup>
                  <col className="w-[17%]" />
                  <col className="w-[33%]" />
                  <col className="w-[17%]" />
                  <col className="w-[19%]" />
                  <col className="w-[14%]" />
                </colgroup>
                <thead className="bg-pink-50 text-left text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="px-6 py-4">Ticket ID</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4">Last Updated</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="align-middle">
                      <td className="px-6 py-5 font-semibold text-[var(--color-text-primary)]">
                        #{ticket.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-5">
                        <h3 className="font-semibold text-[var(--color-text-primary)]">
                          {ticket.subject}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                          {ticket.order_number
                            ? `Order ID: ${ticket.order_number}`
                            : "General support"}
                        </p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(ticket.status)}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs leading-5 text-[var(--color-text-secondary)]">
                        {formatDate(ticket.updated_at || ticket.created_at)}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Link
                          href={`/help-support/${ticket.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-pink-50"
                        >
                          View
                          <InlineIcon name="arrowRight" className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-pink-100 md:hidden">
              {filteredTickets.map((ticket) => (
                <article key={ticket.id} className="grid gap-3 px-4 py-4 text-sm">
                  <div className="font-semibold text-[var(--color-text-primary)]">
                    #{ticket.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">
                      {ticket.subject}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      {ticket.order_number ? `Order ID: ${ticket.order_number}` : "General support"}
                    </p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusClass(ticket.status)}`}>
                    {ticket.status.replace("_", " ")}
                  </span>
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {formatDate(ticket.updated_at || ticket.created_at)}
                  </div>
                  <Link
                    href={`/help-support/${ticket.id}`}
                    className="inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-pink-50"
                  >
                    View Details
                    <InlineIcon name="arrowRight" className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
