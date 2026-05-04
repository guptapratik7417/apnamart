import Link from "next/link";
import InlineIcon from "@/components/InlineIcon";
import { getSiteConfig } from "@/lib/site-config";

const teams = [
  "Catalog operations",
  "Customer support",
  "Seller operations",
  "Product and technology",
];

export default async function CareersPage() {
  const config = await getSiteConfig();

  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <section className="py-12">
        <div className="container-custom">
          <div className="gradient-card shadow-soft rounded-[32px] border border-pink-100 p-8 md:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              Careers
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight text-[var(--color-text-primary)] md:text-6xl">
              Help build the shopping experience behind {config.storeName}.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--color-text-secondary)]">
              We are growing carefully across operations, support, catalog quality,
              and storefront technology. If you care about clean customer journeys
              and dependable commerce, we would love to hear from you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${config.footer.supportEmail}?subject=Career%20interest%20at%20${encodeURIComponent(config.storeName)}`}
                className="btn-primary"
              >
                Send Your Profile
              </a>
              <Link href="/about-us" className="btn-outline">
                About ApnaMart
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {teams.map((team) => (
              <article
                key={team}
                className="shadow-soft rounded-[24px] border border-pink-100 bg-white p-6"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#fff1f6] text-[var(--color-primary)]">
                  <InlineIcon name="gift" className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-lg font-bold text-[var(--color-text-primary)]">
                  {team}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                  Open roles will be published here as the team expands.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
