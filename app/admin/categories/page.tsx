import { redirect } from "next/navigation";
import AdminCategoriesManager from "@/components/AdminCategoriesManager";
import AdminHeader from "@/components/AdminHeader";
import { getAdminSession } from "@/lib/admin-auth";
import { getCategories } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const readOnly = !["super_admin", "client_admin", "seller_admin"].includes(
    session.role
  );

  const categories = await getCategories();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Categories</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Create and maintain storefront category filters from admin.
          </p>
        </div>
        <AdminCategoriesManager categories={categories} readOnly={readOnly} />
      </main>
    </div>
  );
}
