import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminOrdersTable from "@/components/AdminOrdersTable";
import { getAdminSession } from "@/lib/admin-auth";
import { getOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const readOnly = session.role !== "super_admin";

  const orders = await getOrders();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Orders</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Confirm, pack, ship, and update delivery progress from one simple table.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold">No orders yet</h2>
          </div>
        ) : (
          <AdminOrdersTable orders={orders} readOnly={readOnly} />
        )}
      </main>
    </div>
  );
}
