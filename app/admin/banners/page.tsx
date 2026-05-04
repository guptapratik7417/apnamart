import { redirect } from "next/navigation";
import AdminBannersManager from "@/components/AdminBannersManager";
import AdminHeader from "@/components/AdminHeader";
import { getAdminSession } from "@/lib/admin-auth";
import { getBannerImages } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super_admin") redirect("/admin");

  const banners = await getBannerImages({ includeInactive: true });

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Banner Images</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Upload and manage homepage banner images from the database.
          </p>
        </div>
        <AdminBannersManager banners={banners} />
      </main>
    </div>
  );
}
