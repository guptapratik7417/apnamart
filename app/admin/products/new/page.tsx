import Link from "next/link";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminProductForm from "@/components/AdminProductForm";
import { getAdminSession } from "@/lib/admin-auth";
import { getSiteConfig } from "@/lib/site-config";
import { getCategories } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!["super_admin", "client_admin", "seller_admin"].includes(session.role)) {
    redirect("/admin/products");
  }

  const [categories, config] = await Promise.all([getCategories(), getSiteConfig()]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <Link href="/admin/products" className="text-sm text-[var(--color-primary)]">
            Back to products
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold">Add Product</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Keep the fields focused so catalog maintenance stays light.
          </p>
        </div>
        <AdminProductForm
          categories={categories}
          productAttributes={config.productAttributes}
        />
      </main>
    </div>
  );
}
