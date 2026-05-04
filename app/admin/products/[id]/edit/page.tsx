import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminProductForm from "@/components/AdminProductForm";
import { getAdminSession } from "@/lib/admin-auth";
import { getSiteConfig } from "@/lib/site-config";
import { getCategories, getProductById } from "@/lib/store";

export const dynamic = "force-dynamic";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!["super_admin", "client_admin", "seller_admin"].includes(session.role)) {
    redirect("/admin/products");
  }

  const { id } = await params;
  const [product, categories, config] = await Promise.all([
    getProductById(id),
    getCategories(),
    getSiteConfig(),
  ]);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <Link href="/admin/products" className="text-sm text-[var(--color-primary)]">
            Back to products
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold">Edit Product</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Update product details, images, pricing, and category assignment.
          </p>
        </div>
        <AdminProductForm
          categories={categories}
          productAttributes={config.productAttributes}
          initialProduct={product}
        />
      </main>
    </div>
  );
}
