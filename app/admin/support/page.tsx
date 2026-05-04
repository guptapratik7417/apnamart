import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminSupportTickets from "@/components/AdminSupportTickets";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupportTickets } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const tickets = await getSupportTickets();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Help & Support</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Review customer support requests and track resolution status.
          </p>
        </div>
        <AdminSupportTickets tickets={tickets} />
      </main>
    </div>
  );
}
