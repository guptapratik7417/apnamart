import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminInventoryTable from "@/components/AdminInventoryTable";
import { getAdminSession } from "@/lib/admin-auth";
import { getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const readOnly = !["super_admin", "client_admin", "seller_admin"].includes(
    session.role
  );

  const products = await getProducts({
    includeInactive: true,
    limit: 200,
    sort: "name",
  });
  const lowStock = products.filter((product) => product.stock_quantity <= 10);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Inventory</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            {lowStock.length} product{lowStock.length === 1 ? "" : "s"} at or below 10 units.
          </p>
        </div>

        <AdminInventoryTable products={products} readOnly={readOnly} />
      </main>
    </div>
  );
}
