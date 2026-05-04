"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import InlineIcon from "@/components/InlineIcon";
import type {
  SupportReplyVisibility,
  SupportTicket,
  SupportTicketStatus,
} from "@/types";

const statuses: SupportTicketStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "closed",
];

function AuthorIcon({ isAdmin }: { isAdmin: boolean }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
        isAdmin
          ? "bg-blue-100 text-blue-600"
          : "bg-pink-100 text-[var(--color-primary)]"
      }`}
    >
      <InlineIcon name={isAdmin ? "headset" : "comments"} className="h-4 w-4" />
    </span>
  );
}

function MediaGrid({ urls }: { urls?: string[] }) {
  if (!urls?.length) return null;

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {urls.map((url) => {
        const isVideo = /\.(mp4|webm|mov)$/i.test(url);
        return isVideo ? (
          <video
            key={url}
            src={url}
            controls
            className="aspect-square w-full rounded-2xl border border-pink-100 object-cover"
          />
        ) : (
          <img
            key={url}
            src={url}
            alt="Support attachment"
            className="aspect-square w-full rounded-2xl border border-pink-100 object-cover"
          />
        );
      })}
    </div>
  );
}

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

export default function SupportTicketDetail({
  ticket,
  mode,
}: {
  ticket: SupportTicket;
  mode: "customer" | "admin";
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<SupportReplyVisibility>("public");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  async function sendReply() {
    const body = message.trim();
    if (!body) return;

    const requestBody = new FormData();
    requestBody.set("message", body);
    requestBody.set("visibility", visibility);
    mediaFiles.forEach((file) => requestBody.append("media", file));

    setBusy(true);
    const response = await fetch(
      mode === "admin"
        ? `/api/admin/support/${ticket.id}/replies`
        : `/api/support/${ticket.id}/replies`,
      {
        method: "POST",
        body: requestBody,
      }
    );
    setBusy(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Reply failed");
      return;
    }

    setMessage("");
    setMediaFiles([]);
    router.refresh();
  }

  async function updateStatus(status: SupportTicketStatus) {
    if (mode !== "admin") return;
    setBusy(true);
    const response = await fetch(`/api/admin/support/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Support ticket update failed");
      return;
    }
    router.refresh();
  }

  function authorLabel(authorType: "customer" | "admin", authorName?: string | null) {
    if (authorType === "admin") {
      return mode === "admin" ? authorName || "Support Team" : "Support Team";
    }

    return authorName || ticket.customer_name || "Customer";
  }

  return (
    <div className="space-y-6">
      <section className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href={mode === "admin" ? "/admin/support" : "/help-support"}
              className="inline-flex rounded-xl border border-pink-100 bg-[#fff8fb] px-3 py-2 text-sm font-semibold text-[var(--color-primary)]"
            >
              Back to Tickets
            </Link>
            <h1 className="mt-5 text-3xl font-bold text-[var(--color-text-primary)]">
              {ticket.subject}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Ticket ID: #{ticket.id.slice(0, 8).toUpperCase()}
              {ticket.order_number ? ` · Order ID: ${ticket.order_number}` : ""}
              {" · "}Created on {formatDate(ticket.created_at)}
            </p>
          </div>
          {mode === "admin" ? (
            <select
              className="input max-w-48"
              value={ticket.status}
              disabled={busy}
              onChange={(event) =>
                updateStatus(event.target.value as SupportTicketStatus)
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          ) : (
            <span className="w-fit rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold capitalize text-[var(--color-primary)]">
              {ticket.status.replace("_", " ")}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-4 border-t border-pink-100 pt-5 md:grid-cols-3">
          {[
            ["Status", ticket.status.replace("_", " ")],
            ["Category", ticket.order_number ? "Order & Delivery" : "General Support"],
            ["Last Updated", formatDate(ticket.updated_at || ticket.created_at)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-[#fff8fb] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                {label}
              </p>
              <p className="mt-2 font-semibold capitalize text-[var(--color-text-primary)]">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-6">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Conversation
          </h2>
          <div className="mt-5 space-y-4">
            <div className="flex max-w-[86%] gap-3">
              <AuthorIcon isAdmin={false} />
              <div className="flex-1 rounded-3xl border border-pink-100 bg-[#fff1f6] p-5 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <span>{ticket.customer_name || "Customer"}</span>
                  <span>/</span>
                  <span>{formatDate(ticket.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap">{ticket.message}</p>
                <MediaGrid urls={ticket.media_urls} />
              </div>
            </div>

            {(ticket.replies || []).map((reply) => {
              const isAdmin = reply.author_type === "admin";
              return (
                <div
                  key={reply.id}
                  className={`flex max-w-[86%] gap-3 ${
                    isAdmin
                      ? "ml-auto flex-row-reverse"
                      : ""
                  }`}
                >
                  <AuthorIcon isAdmin={isAdmin} />
                  <div
                    className={`flex-1 rounded-3xl border p-5 text-sm ${
                      isAdmin
                        ? "border-blue-100 bg-blue-50"
                        : "border-pink-100 bg-[#fff1f6]"
                    } ${
                      reply.visibility === "private" ? "border-amber-200 bg-amber-50" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                      <span>{authorLabel(reply.author_type, reply.author_name)}</span>
                      <span>/</span>
                      <span>{formatDate(reply.created_at)}</span>
                      {mode === "admin" && (
                        <>
                          <span>/</span>
                          <span className="capitalize">{reply.visibility}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap">{reply.message}</p>
                    <MediaGrid urls={reply.media_urls} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-pink-100 p-3">
            <div className="grid gap-3 lg:grid-cols-[160px_1fr_auto]">
              {mode === "admin" && (
                <select
                  className="input"
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(event.target.value as SupportReplyVisibility)
                  }
                >
                  <option value="public">Public reply</option>
                  <option value="private">Private note</option>
                </select>
              )}
              <textarea
                className={`input min-h-24 ${mode === "customer" ? "lg:col-span-2" : ""}`}
                placeholder={mode === "admin" ? "Write a reply or private note" : "Reply to support"}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
              <button
                type="button"
                className="btn-primary h-fit"
                disabled={busy}
                onClick={sendReply}
              >
                {busy ? "Sending..." : "Send Reply"}
              </button>
            </div>
            <label className="mt-3 block space-y-2">
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Attach photos or videos
              </span>
              <input
                className="input"
                type="file"
                accept="image/*,video/mp4,video/webm,video/quicktime"
                multiple
                onChange={(event) =>
                  setMediaFiles(Array.from(event.target.files || []).slice(0, 3))
                }
              />
              <span className="block text-xs text-[var(--color-text-secondary)]">
                Up to 3 files. Images or videos, 10MB each.
              </span>
            </label>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="shadow-soft rounded-[32px] border border-pink-100 bg-white p-6">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Ticket Details
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-secondary)]">Status</dt>
                <dd className="font-semibold capitalize text-[var(--color-primary)]">
                  {ticket.status.replace("_", " ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-secondary)]">Customer</dt>
                <dd className="text-right font-semibold">{ticket.customer_name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-secondary)]">Email</dt>
                <dd className="text-right font-semibold">{ticket.customer_email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--color-text-secondary)]">Created</dt>
                <dd className="text-right font-semibold">{formatDate(ticket.created_at)}</dd>
              </div>
            </dl>
          </section>

          <section className="gradient-card shadow-soft rounded-[32px] border border-pink-100 p-6">
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              Need More Help?
            </h2>
            <div className="mt-4 space-y-3">
              <Link
                href="/help-support"
                className="flex items-center justify-between gap-4 rounded-2xl border border-pink-100 bg-white p-4 text-sm font-semibold text-[var(--color-primary)]"
              >
                <span>
                  <span className="block text-[var(--color-text-primary)]">Live Chat</span>
                  <span className="mt-1 block font-normal text-[var(--color-text-secondary)]">
                    Instant support
                  </span>
                </span>
                <InlineIcon name="comments" className="h-6 w-6" />
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-between gap-4 rounded-2xl border border-pink-100 bg-white p-4 text-sm font-semibold text-[var(--color-primary)]"
              >
                <span>
                  <span className="block text-[var(--color-text-primary)]">Email Support</span>
                  <span className="mt-1 block font-normal text-[var(--color-text-secondary)]">
                    Support team
                  </span>
                </span>
                <InlineIcon name="envelope" className="h-6 w-6" />
              </Link>
            </div>
          </section>
        </aside>
      </div>

      {mode === "admin" && ticket.admin_notes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
            Existing Private Note
          </p>
          <p className="mt-1 whitespace-pre-wrap">{ticket.admin_notes}</p>
        </div>
      )}
    </div>
  );
}
