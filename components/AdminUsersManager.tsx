"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminRole, AdminUser, CreateAdminUserInput } from "@/types";

const roleOptions: Array<{ value: AdminRole; label: string }> = [
  { value: "super_admin", label: "Super Admin" },
  { value: "client_admin", label: "Client Admin" },
  { value: "seller_admin", label: "Seller Admin" },
  { value: "admin", label: "Read Admin" },
];

export default function AdminUsersManager({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CreateAdminUserInput>({
    username: "",
    full_name: "",
    password: "",
    role: "seller_admin",
  });

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Admin user create failed");
      return;
    }

    setForm({ username: "", full_name: "", password: "", role: "seller_admin" });
    router.refresh();
  }

  async function updateRole(user: AdminUser, role: AdminRole) {
    setBusyId(user.id);
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setBusyId("");

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Admin user update failed");
      return;
    }

    router.refresh();
  }

  async function remove(user: AdminUser) {
    if (!window.confirm(`Delete admin user ${user.username}?`)) return;
    setBusyId(user.id);
    const response = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
    });
    setBusyId("");

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      alert(payload.error || "Admin user delete failed");
      return;
    }

    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <form onSubmit={create} className="rounded-lg bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Create Admin</h2>
        <div className="mt-5 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Username</span>
            <input
              className="input"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Full Name</span>
            <input
              className="input"
              value={form.full_name || ""}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input
              className="input"
              type="password"
              minLength={6}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Role</span>
            <select
              className="input"
              value={form.role}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value as AdminRole })
              }
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="btn-primary mt-5 w-full" disabled={saving}>
          {saving ? "Creating..." : "Create Admin"}
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full min-w-[720px]">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Admin</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-light)]">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-5 py-4">
                  <p className="font-medium">{user.full_name || user.username}</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {user.username}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <select
                    className="input max-w-48"
                    value={user.role}
                    disabled={busyId === user.id}
                    onChange={(event) =>
                      updateRole(user, event.target.value as AdminRole)
                    }
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-4 text-sm text-[var(--color-text-secondary)]">
                  {new Date(user.created_at).toLocaleDateString("en-IN")}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                    disabled={busyId === user.id}
                    onClick={() => remove(user)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
