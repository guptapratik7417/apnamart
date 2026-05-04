import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminUsersManager from "@/components/AdminUsersManager";
import { getAdminSession } from "@/lib/admin-auth";
import { getAdminUsers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super_admin") redirect("/admin");

  const users = await getAdminUsers();

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <AdminHeader />
      <main className="container-custom py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold">Admin Users</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Create super, client, seller, and read-only admin accounts.
          </p>
        </div>
        <AdminUsersManager users={users} />
      </main>
    </div>
  );
}
