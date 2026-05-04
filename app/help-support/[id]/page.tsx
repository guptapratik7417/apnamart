import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SupportTicketDetail from "@/components/SupportTicketDetail";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSupportTicketById } from "@/lib/store";

export const dynamic = "force-dynamic";

type SupportTicketPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SupportTicketPage({
  params,
}: SupportTicketPageProps) {
  const user = await getCustomerSession();
  if (!user) redirect("/login?redirect=/help-support");

  const { id } = await params;
  const ticket = await getSupportTicketById(id, "customer", user.id);
  if (!ticket) notFound();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="py-10">
        <div className="container-custom">
          <div className="mb-6 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <Link href="/help-support" className="hover:text-[var(--color-primary)]">
              Help & Support
            </Link>
            <span>/</span>
            <span>Ticket Detail</span>
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Support Ticket
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[var(--color-text-primary)]">
            Ticket conversation
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-text-secondary)]">
            Public support replies and your messages stay together here.
          </p>
        </div>
      </section>
      <main className="container-custom py-10">
        <SupportTicketDetail ticket={ticket} mode="customer" />
      </main>
    </div>
  );
}
