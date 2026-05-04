import Link from "next/link";
import WishlistGrid from "@/components/WishlistGrid";
import { getCustomerSession } from "@/lib/customer-auth";
import { getSiteConfig } from "@/lib/site-config";
import { getWishlist } from "@/lib/wishlist-store";

export default async function WishlistPage() {
  const config = await getSiteConfig();
  const user = await getCustomerSession();
  const items = user ? await getWishlist(user.id) : [];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="bg-[#fff1f6] py-14">
        <div className="container-custom text-center">
          <p className="text-sm font-bold text-[var(--color-primary)]">
            {config.wishlist.eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-bold">
            {config.wishlist.title}
          </h1>
        </div>
      </section>

      <section className="container-custom py-10">
        {!user ? (
          <div className="rounded-lg border border-[var(--color-border-light)] bg-white p-8 text-center shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-[var(--color-text-primary)]">
              {config.wishlist.loginTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
              {config.wishlist.loginText}
            </p>
            <Link href="/login" className="btn-primary mt-6 inline-flex">
              {config.wishlist.loginCtaLabel}
            </Link>
          </div>
        ) : items.length ? (
          <WishlistGrid
            initialItems={items}
            attributeOptions={config.productAttributes}
          />
        ) : (
          <div className="rounded-lg border border-[var(--color-border-light)] bg-white p-8 text-center shadow-sm">
            <h2 className="font-serif text-2xl font-bold text-[var(--color-text-primary)]">
              {config.wishlist.emptyTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[var(--color-text-secondary)]">
              {config.wishlist.emptyText}
            </p>
            <Link href="/products" className="btn-primary mt-6 inline-flex">
              {config.wishlist.emptyCtaLabel}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
