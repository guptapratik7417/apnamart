import { notFound, redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import SupportTicketDetail from "@/components/SupportTicketDetail";
import { getAdminSession } from "@/lib/admin-auth";
import { getSupportTicketById } from "@/lib/store";

export const dynamic = "force-dynamic";

type AdminSupportTicketPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminSupportTicketPage({
  params,
}: AdminSupportTicketPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  const ticket = await getSupportTicketById(id, "admin");
  if (!ticket) notFound();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <SupportTicketDetail ticket={ticket} mode="admin" />
      </main>
    </div>
  );
}
