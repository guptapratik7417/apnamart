import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminSettingsForm from "@/components/AdminSettingsForm";
import { getAdminSession } from "@/lib/admin-auth";
import { getSiteConfigRecords } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super_admin") redirect("/admin");

  const records = await getSiteConfigRecords();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Settings</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Manage store content, navigation, checkout rules, and product type
            options from feature-level config records.
          </p>
        </div>
        <AdminSettingsForm initialRecords={records} />
      </main>
    </div>
  );
}
