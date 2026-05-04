import Link from "next/link";
import FeedbackForm from "@/components/FeedbackForm";
import InlineIcon from "@/components/InlineIcon";

export default function ShareFeedbackPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <section className="py-12">
        <div className="container-custom">
          <div className="mb-6 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Link href="/" className="hover:text-[var(--color-primary)]">
              Home
            </Link>
            <span>/</span>
            <span>Share Feedback</span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
            <div>
              <div className="gradient-card shadow-soft rounded-[32px] border border-pink-100 p-8 md:p-10">
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
                  Share Feedback
                </p>
                <h1 className="mt-4 text-4xl font-bold leading-tight text-[var(--color-text-primary)] md:text-6xl">
                  Tell us what should feel better.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
                  Share feedback about the website, products, support experience,
                  or order flow. Your message is routed to the support team as a
                  trackable request.
                </p>
              </div>

              <div className="mt-8">
                <FeedbackForm />
              </div>
            </div>

            <aside className="space-y-5">
              {[
                ["Fast routing", "Feedback becomes a support record for follow-up."],
                ["Product input", "Tell us if images, details, or prices need correction."],
                ["Experience notes", "Share ideas for checkout, order tracking, or account pages."],
              ].map(([title, text]) => (
                <article
                  key={title}
                  className="shadow-soft rounded-[24px] border border-pink-100 bg-white p-6"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1f6] text-[var(--color-primary)]">
                    <InlineIcon name="comments" className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-[var(--color-text-primary)]">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {text}
                  </p>
                </article>
              ))}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}
