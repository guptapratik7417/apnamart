import Link from "next/link";

export default function DownloadAppPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <section className="bg-[#fff1f6] py-16">
        <div className="container-custom grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              Mobile Apps Coming Soon
            </p>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-[var(--color-secondary)] md:text-6xl">
              Shop ApnaMart on web and mobile web today.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-[var(--color-text-secondary)]">
              Our Android and iOS apps are being polished. Until then, the full
              shopping experience is available on desktop, mobile browser, and
              tablet with your account, cart, orders, support, and wishlist.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                Continue Shopping
              </Link>
              <Link href="/help-support" className="btn-outline">
                Get Support
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-pink-100 bg-white p-5 shadow-xl">
            <div className="rounded-[1.5rem] border border-pink-100 bg-[#fff8fb] p-5">
              <div className="rounded-2xl border border-pink-100 bg-white p-4">
                <p className="text-sm font-semibold text-[var(--color-primary)]">Available now</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[var(--color-text-primary)]">Web / MWeb</h2>
                <div className="mt-6 grid gap-3">
                  {["Catalog", "Wishlist", "Checkout", "Order Support"].map(
                    (item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-pink-100 bg-[#fff8fb] px-4 py-3 font-semibold text-[var(--color-text-primary)]"
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-xs text-[var(--color-text-secondary)]">Coming soon on</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">Google Play</p>
                </div>
                <div className="rounded-xl border border-pink-100 bg-white px-4 py-3 text-center shadow-sm">
                  <p className="text-xs text-[var(--color-text-secondary)]">Coming soon on</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">App Store</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
