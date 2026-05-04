import Link from "next/link";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import { getAdminSession } from "@/lib/admin-auth";
import { getDashboardStats } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const readOnly = session.role !== "super_admin";

  const stats = await getDashboardStats();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Small set of numbers that matter for the MVP.
            </p>
          </div>
          {!readOnly && (
            <Link href="/admin/products/new" className="btn-primary w-fit">
              Add Product
            </Link>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Orders", String(stats.total_orders)],
            ["Revenue", formatPrice(stats.total_revenue)],
            ["Products", String(stats.total_products)],
            ["Customers", String(stats.total_customers)],
          ].map(([label, value]) => (
            <section key={label} className="rounded-lg bg-white p-5 shadow-sm">
              <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
              <p className="mt-2 text-2xl font-bold">{value}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] p-5">
              <h2 className="font-semibold">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-[var(--color-primary)]">
                View all
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-border-light)]">
              {stats.recent_orders.length === 0 ? (
                <p className="p-5 text-sm text-[var(--color-text-secondary)]">
                  No orders yet.
                </p>
              ) : (
                stats.recent_orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {order.shipping_name || order.customer_email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total)}</p>
                      <p className="text-sm capitalize text-[var(--color-text-secondary)]">
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--color-border-light)] p-5">
              <h2 className="font-semibold">Low Stock</h2>
              <Link href="/admin/inventory" className="text-sm text-[var(--color-primary)]">
                Manage inventory
              </Link>
            </div>
            <div className="divide-y divide-[var(--color-border-light)]">
              {stats.low_stock_products.length === 0 ? (
                <p className="p-5 text-sm text-[var(--color-text-secondary)]">
                  Stock levels look healthy.
                </p>
              ) : (
                stats.low_stock_products.map((product) => (
                  <div key={product.id} className="flex items-center justify-between gap-4 p-5">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {product.category?.name || "Uncategorized"}
                      </p>
                    </div>
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                      {product.stock_quantity} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
