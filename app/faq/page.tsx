import Link from "next/link";

const faqs = [
  {
    question: "How can I track my order?",
    answer:
      "Open Track Order from the header or your order history. You can view status, delivery details, and support actions from the order page.",
  },
  {
    question: "Can I raise a support ticket for an order?",
    answer:
      "Yes. On Help & Support, select the order from your order history and submit the issue. Your tickets and replies stay visible from the same support area.",
  },
  {
    question: "How do returns and refunds work?",
    answer:
      "Returns and refunds depend on order status, product condition, and admin review. You can request help from order history or Help & Support.",
  },
  {
    question: "When will the mobile app be available?",
    answer:
      "The storefront is available on web and mobile web today. Android and iOS apps are planned and will be announced from the Download App page.",
  },
  {
    question: "How do I share feedback?",
    answer:
      "Use the Share Feedback page to send product, order, support, or website feedback. It reaches the support team as a trackable request.",
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <section className="py-12">
        <div className="container-custom">
          <div className="gradient-card shadow-soft rounded-[32px] border border-pink-100 p-8 md:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
              FAQ
            </p>
            <h1 className="mt-4 text-4xl font-bold text-[var(--color-text-primary)] md:text-6xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-[var(--color-text-secondary)]">
              Quick answers for shopping, order tracking, support tickets, returns,
              and the upcoming mobile app.
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            {faqs.map((faq) => (
              <article
                key={faq.question}
                className="shadow-soft rounded-[24px] border border-pink-100 bg-white p-6"
              >
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {faq.question}
                </h2>
                <p className="mt-3 leading-7 text-[var(--color-text-secondary)]">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>

          <div className="shadow-soft mt-8 rounded-[28px] border border-pink-100 bg-white p-6 md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                Still need help?
              </h2>
              <p className="mt-2 text-[var(--color-text-secondary)]">
                Raise a support ticket and our team will reply.
              </p>
            </div>
            <Link href="/help-support" className="btn-primary mt-5 inline-flex md:mt-0">
              Visit Help Center
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
