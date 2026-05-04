import Link from "next/link";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminProductsTable from "@/components/AdminProductsTable";
import { getAdminSession } from "@/lib/admin-auth";
import { getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const readOnly = !["super_admin", "client_admin", "seller_admin"].includes(
    session.role
  );

  const products = await getProducts({
    includeInactive: true,
    limit: 200,
    sort: "newest",
  });

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Products</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Manage catalog, featured products, and publish status.
            </p>
          </div>
          {!readOnly && (
            <Link href="/admin/products/new" className="btn-primary w-fit">
              Add Product
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="rounded-lg bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold">No products yet</h2>
            {!readOnly && (
              <Link href="/admin/products/new" className="btn-primary mt-5 inline-flex">
                Add first product
              </Link>
            )}
          </div>
        ) : (
          <AdminProductsTable products={products} readOnly={readOnly} />
        )}
      </main>
    </div>
  );
}
