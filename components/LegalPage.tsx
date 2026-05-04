import type { LegalPageConfig } from "@/types";

export default function LegalPage({ page }: { page: LegalPageConfig }) {
  return (
    <main className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom py-12">
        <div className="mb-8 max-w-3xl">
          <h1 className="font-serif text-4xl font-bold text-[var(--color-secondary)]">
            {page.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {page.updatedLabel}
          </p>
        </div>

        <div className="space-y-5 rounded-lg bg-white p-6 shadow-sm">
          {page.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 leading-7 text-[var(--color-text-secondary)]">
                {section.text}
              </p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
