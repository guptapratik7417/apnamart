import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AdminCategoryForm from "@/components/AdminCategoryForm";
import AdminHeader from "@/components/AdminHeader";
import { getAdminSession } from "@/lib/admin-auth";
import { getCategoryById } from "@/lib/store";

export const dynamic = "force-dynamic";

type EditCategoryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!["super_admin", "client_admin", "seller_admin"].includes(session.role)) {
    redirect("/admin/categories");
  }

  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) notFound();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <Link href="/admin/categories" className="text-sm text-[var(--color-primary)]">
            Back to categories
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold">Edit Category</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Update category text, order, and uploaded image.
          </p>
        </div>
        <AdminCategoryForm category={category} />
      </main>
    </div>
  );
}
