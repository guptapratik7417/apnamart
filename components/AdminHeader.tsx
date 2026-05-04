"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSiteConfig } from "@/lib/use-site-config";
import type { AdminAccountConfig } from "@/types";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/banners", label: "Banners" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/users", label: "Admin Users" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const config = useSiteConfig();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminAccountConfig | null>(null);
  const visibleLinks =
    adminUser?.role === "super_admin"
      ? links
      : links.filter(
          (link) =>
            link.href !== "/admin/settings" && link.href !== "/admin/users"
        );

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/admin/session", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as {
        user?: AdminAccountConfig | null;
      };
      setAdminUser(payload.user || null);
    }

    void loadSession();
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-[var(--color-border-light)] bg-white">
      <div className="container-custom flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Link href="/admin" className="font-serif text-xl font-bold">
            {config.adminTitle}
          </Link>
          <nav className="hidden md:flex flex-wrap gap-2 md:ml-6">
            {visibleLinks.map((link) => {
              const active =
                link.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-secondary)] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile menu button */}
        <div className="relative md:hidden">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            <span>Menu</span>
            <svg
              className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-[var(--color-border-light)] bg-white py-1 shadow-lg">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDropdownOpen(false)}
                  className={`block px-4 py-2 text-sm ${
                    (link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href))
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-secondary)] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Desktop dropdown with admin name */}
        <div className="hidden relative md:block">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-gray-50"
          >
            <span className="font-medium text-[var(--color-text)]">
              {adminUser?.displayName || "Admin"}
            </span>
            <svg
              className={`h-4 w-4 text-[var(--color-text-secondary)] transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-[var(--color-border-light)] bg-white py-1 shadow-lg">
              {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setDropdownOpen(false)}
                  className={`block px-4 py-2 text-sm ${
                    (link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href))
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-secondary)] hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-1 border-[var(--color-border-light)]" />
              {adminUser && (
                <div className="px-4 py-2 text-xs text-[var(--color-text-secondary)]">
                  {adminUser.username} ·{" "}
                  {adminUser.role === "super_admin"
                    ? "Full access"
                    : adminUser.role === "client_admin"
                      ? "Client admin"
                      : adminUser.role === "seller_admin"
                        ? "Seller admin"
                        : "Read access"}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
