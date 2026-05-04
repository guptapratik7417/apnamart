"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { clearCart, useCartCount } from "@/lib/cart-client";
import type { SiteConfig, User } from "@/types";

export default function Header({ config }: { config: SiteConfig }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const cartCount = useCartCount();
  const firstName = user?.full_name?.trim().split(/\s+/)[0] || user?.email.split("@")[0];

  useEffect(() => {
    async function loadSession() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { user?: User | null };
      setUser(payload.user || null);
    }

    void loadSession();
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    clearCart();
    window.location.href = "/";
  }

  if (pathname.startsWith("/admin")) return null;

  const navLinks = config.navigation.mainLinks;
  const activeCategory = searchParams.get("category");
  const activeSort = searchParams.get("sort");
  const searchSuggestions = Array.from(
    new Set([
      ...navLinks.map((link) => link.label),
      ...config.navigation.footerShopLinks.map((link) => link.label),
      ...config.productAttributes.map((attribute) => attribute.label),
      "Track Order",
      "Help & Support",
      "Share Feedback",
      "Wishlist",
      "Cart",
    ])
  );

  function linkSearchValue(href: string, key: string) {
    const query = href.split("?")[1];
    if (!query) return null;
    return new URLSearchParams(query).get(key);
  }

  function isNavLinkActive(href: string) {
    const [targetPath] = href.split("?");
    const targetCategory = linkSearchValue(href, "category");
    const targetSort = linkSearchValue(href, "sort");

    if (targetPath === "/products") {
      if (pathname !== "/products") return false;
      if (targetCategory) return activeCategory === targetCategory;
      if (targetSort) return !activeCategory && activeSort === targetSort;
      return !activeCategory && !activeSort;
    }

    return href === "/" ? pathname === "/" : pathname === targetPath;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-light)] bg-white/95 backdrop-blur">
      <div className="border-b border-[var(--color-border-light)] bg-[#fff1f6] text-xs text-[var(--color-secondary)]">
        <div className="container-custom flex h-9 items-center justify-between gap-4">
          <p className="truncate">{config.navigation.utilityLeftText}</p>
          <div className="hidden items-center gap-3 sm:flex">
            {config.navigation.utilityLinks.map((link, index) => (
              <span key={`${link.href}-${link.label}`} className="flex items-center gap-3">
                {index > 0 && <span className="text-pink-200">|</span>}
                {(() => {
                  const label = link.label.toLowerCase();
                  const href = label.includes("help")
                    ? "/help-support"
                    : label.includes("download app")
                      ? "/download-app"
                      : link.href;
                  return href.startsWith("mailto:") || href.startsWith("tel:") ? (
                  <a href={href} className="hover:text-[var(--color-primary)]">
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="hover:text-[var(--color-primary)]"
                  >
                    {link.label}
                  </Link>
                );
                })()}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom">
        <div className="flex min-h-20 items-center justify-between gap-4 py-3">
          <Link href="/" className="flex min-w-fit items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fff0f6] text-xl font-bold text-[var(--color-primary)] ring-1 ring-pink-100">
              ✦
            </span>
            <span>
              <span className="block font-serif text-2xl font-semibold leading-none text-[var(--color-secondary)]">
                {config.storeName}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {config.navigation.logoTagline}
              </span>
            </span>
          </Link>

          <form action="/products" className="hidden min-w-0 flex-1 items-center lg:flex">
            <div className="relative mx-auto w-full max-w-xl">
              <input
                name="q"
                list="site-search-suggestions"
                placeholder={config.navigation.searchPlaceholder}
                className="h-12 w-full rounded-full border border-pink-100 bg-[#fff8fb] px-6 pr-14 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-pink-100"
              />
              <datalist id="site-search-suggestions">
                {searchSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-white transition hover:bg-[var(--color-primary-dark)]"
              >
                ⌕
              </button>
            </div>
          </form>

          <div className="flex items-center gap-2">
            <Link
              href="/wishlist"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-secondary)] transition hover:bg-pink-50 hover:text-[var(--color-primary)] sm:block"
            >
              ♡ {config.navigation.wishlistLabel}
            </Link>
            {user ? (
              <div className="relative hidden sm:block">
                <button
                  type="button"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-secondary)] transition-colors hover:bg-gray-50 hover:text-[var(--color-primary)]"
                  onClick={() => setIsAccountOpen((value) => !value)}
                  aria-expanded={isAccountOpen}
                  aria-haspopup="menu"
                  title={user.email}
                >
                  Hi {firstName}
                  <span className="ml-1 text-xs">▾</span>
                </button>

                {isAccountOpen && (
                  <div
                    className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-[var(--color-border-light)] bg-white py-2 shadow-lg"
                    role="menu"
                  >
                    <div className="border-b border-[var(--color-border-light)] px-4 py-2">
                      <p className="text-sm font-semibold text-[var(--color-secondary)]">
                        Hi {firstName}
                      </p>
                      <p className="truncate text-xs text-[var(--color-text-secondary)]">
                        {user.email}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-primary)]"
                      onClick={() => setIsAccountOpen(false)}
                      role="menuitem"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-primary)]"
                      onClick={() => setIsAccountOpen(false)}
                      role="menuitem"
                    >
                      Orders
                    </Link>
                    <button
                      type="button"
                      className="block w-full px-4 py-2 text-left text-sm text-[var(--color-text-secondary)] hover:bg-gray-50 hover:text-[var(--color-primary)]"
                      onClick={logout}
                      role="menuitem"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-gray-50 hover:text-[var(--color-primary)] sm:block"
              >
                {config.navigation.loginLabel}
              </Link>
            )}
            <Link
              href="/cart"
              className="relative rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-secondary)] transition-colors hover:bg-pink-50 hover:text-[var(--color-primary)]"
              aria-label="Open cart"
            >
              🛍 {config.navigation.cartLabel}
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-xs font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="rounded-lg p-2 text-[var(--color-text-secondary)] lg:hidden"
              onClick={() => setIsOpen((value) => !value)}
              aria-label="Toggle menu"
            >
              {isOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>

        <div className="hidden items-center gap-6 border-t border-[var(--color-border-light)] py-3 lg:flex">
          <Link
            href="/products"
            className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white shadow-sm"
          >
            ☰ {config.navigation.categoryMenuLabel}
          </Link>
          <nav className="flex flex-1 items-center justify-center gap-7">
            {navLinks.map((item) => {
              const isActive = isNavLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`border-b-2 py-1 text-sm font-semibold transition ${
                    isActive
                      ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                      : "border-transparent text-[var(--color-secondary)] hover:text-[var(--color-primary)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {isOpen && (
          <nav className="border-t border-[var(--color-border-light)] py-4 lg:hidden">
            <div className="flex flex-col gap-3">
              <form action="/products" className="mb-2 flex">
                <input
                  name="q"
                  list="site-search-suggestions"
                  placeholder={config.navigation.mobileSearchPlaceholder}
                  className="input rounded-r-none"
                />
                <button className="btn-primary rounded-l-none px-4" type="submit">
                  Search
                </button>
              </form>
              {navLinks.map((item) => {
                const isActive = isNavLinkActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={
                      isActive
                        ? "font-semibold text-[var(--color-primary)]"
                        : "text-[var(--color-text-secondary)]"
                    }
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
              {user ? (
                <div className="rounded-lg border border-[var(--color-border-light)] bg-white">
                  <div className="border-b border-[var(--color-border-light)] px-3 py-2">
                    <p className="font-semibold text-[var(--color-secondary)]">
                      Hi {firstName}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-secondary)]">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    className="block px-3 py-2 text-[var(--color-text-secondary)]"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-3 py-2 text-[var(--color-text-secondary)]"
                    onClick={() => setIsOpen(false)}
                  >
                    Orders
                  </Link>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-[var(--color-text-secondary)]"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-[var(--color-text-secondary)]"
                  onClick={() => setIsOpen(false)}
                >
                  {config.navigation.loginLabel}
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
