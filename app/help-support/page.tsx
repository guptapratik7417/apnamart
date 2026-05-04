import Link from "next/link";
import SupportForm from "@/components/SupportForm";
import SupportTicketsList from "@/components/SupportTicketsList";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSiteConfig } from "@/lib/site-config";
import { getOrdersByUserId, getSupportTicketsByUserId } from "@/lib/store";

export const dynamic = "force-dynamic";

type HelpSupportPageProps = {
  searchParams?: Promise<{ orderId?: string }>;
};

export default async function HelpSupportPage({ searchParams }: HelpSupportPageProps) {
  const [user, config] = await Promise.all([
    getCustomerSession(),
    getSiteConfig(),
  ]);
  const selectedOrderId = (await searchParams)?.orderId || "";
  const [orders, tickets] = user
    ? await Promise.all([
        getOrdersByUserId(user.id),
        getSupportTicketsByUserId(user.id),
      ])
    : [[], []];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="py-10">
        <div className="container-custom">
          <div className="mb-6 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <span>Help & Support</span>
          </div>
          <div className="gradient-card shadow-soft rounded-[32px] border border-pink-100 p-8">
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)] md:text-5xl">
              Help & Support
            </h1>
            <p className="mt-3 text-[var(--color-text-secondary)]">
              We are here to help. Find answers and manage your tickets in one place.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <div className="rounded-2xl border border-pink-100 bg-white p-3">
                <input
                  list="help-search-suggestions"
                  className="w-full border-0 px-3 py-2 text-sm outline-none"
                  placeholder="Search help articles..."
                />
                <datalist id="help-search-suggestions">
                  <option value="Track order" />
                  <option value="Refund request" />
                  <option value="Wrong product received" />
                  <option value="Order not delivered" />
                  <option value="Share feedback" />
                  <option value="Return policy" />
                </datalist>
              </div>
              <Link
                href="/help-support"
                className="pink-gradient rounded-2xl px-7 py-3 text-center text-sm font-semibold text-white"
              >
                Search
              </Link>
              <Link
                href="#raise-ticket"
                className="rounded-2xl border border-pink-100 bg-white px-5 py-3 text-center text-sm font-medium text-[var(--color-text-primary)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="container-custom grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div id="raise-ticket">
            <SupportForm user={user} orders={orders} selectedOrderId={selectedOrderId} />
          </div>
          <SupportTicketsList tickets={tickets} />
        </div>

        <aside className="space-y-5">
          <div className="shadow-soft rounded-[24px] border border-pink-100 bg-white p-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Contact
            </h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
              <p>
                Email:{" "}
                <a
                  href={`mailto:${config.footer.supportEmail}`}
                  className="font-semibold text-[var(--color-primary)]"
                >
                  {config.footer.supportEmail}
                </a>
              </p>
              <p>
                Phone:{" "}
                <a
                  href={`tel:${config.footer.supportPhoneHref}`}
                  className="font-semibold text-[var(--color-primary)]"
                >
                  {config.footer.supportPhoneLabel}
                </a>
              </p>
            </div>
          </div>

          <div className="gradient-card shadow-soft rounded-[24px] border border-pink-100 p-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Quick Links
            </h2>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <Link href="/orders" className="font-semibold text-[var(--color-primary)]">
                Track orders
              </Link>
              <Link href="/terms-and-conditions" className="font-semibold text-[var(--color-primary)]">
                Returns and refunds
              </Link>
              <Link href="/privacy-policy" className="font-semibold text-[var(--color-primary)]">
                Privacy policy
              </Link>
            </div>
          </div>

          <div className="gradient-card shadow-soft rounded-[24px] border border-pink-100 p-6">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Need More Help?
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Our support team is available for faster order resolution.
            </p>
            <div className="mt-4 space-y-3">
              <Link href="/help-support" className="block rounded-2xl bg-white p-4 text-sm font-semibold text-[var(--color-primary)]">
                Live Chat
              </Link>
              <a href={`mailto:${config.footer.supportEmail}`} className="block rounded-2xl bg-white p-4 text-sm font-semibold text-[var(--color-primary)]">
                Email Support
              </a>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
