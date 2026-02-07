import Link from "next/link";

const FAQS = [
  {
    q: "How does cycle syncing work?",
    a: "BloomFlow uses your last period start date and average cycle length to estimate your current cycle phase (Menstrual, Follicular, Ovulation, Luteal). This helps BloomGuide AI tailor workout suggestions to your energy levels throughout the month.",
  },
  {
    q: "Why does BloomFlow need my cycle data?",
    a: "Your cycle phase affects energy, recovery, and performance. By understanding where you are in your cycle, BloomGuide can suggest workouts that align with how you might feel—e.g., gentler options during menstruation or higher-intensity options during the follicular phase.",
  },
  {
    q: "How accurate is the cycle prediction?",
    a: "Cycle lengths vary. BloomFlow uses your average cycle length and last period date to estimate phases. The prediction improves as you log period data over time. Always treat it as a guide, not a medical tool.",
  },
  {
    q: "Can I update my cycle data later?",
    a: "Yes. You can update your last period start date and average cycle length in your profile settings (coming soon). For now, contact us to update your data.",
  },
  {
    q: "Is my cycle data private?",
    a: "Yes. Your cycle data is stored securely and is only used to personalize your BloomGuide AI experience. We never share your personal data without your consent.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <h1 className="mb-2 text-2xl font-semibold text-primary sm:text-3xl">
        Help & FAQs
      </h1>
      <p className="mb-8 text-foreground/80 text-sm sm:text-base">
        Answers to common questions about BloomFlow and cycle syncing.
      </p>

      <section className="mb-12 space-y-6">
        <h2 className="text-lg font-semibold text-primary">Cycle Syncing</h2>
        <ul className="space-y-6">
          {FAQS.map((faq, i) => (
            <li key={i} className="rounded-xl border border-primary/20 bg-background/50 p-4 sm:p-6">
              <h3 className="mb-2 font-medium text-foreground">{faq.q}</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{faq.a}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
        <h2 className="mb-2 text-lg font-semibold text-primary">Contact</h2>
        <p className="mb-4 text-sm text-foreground/80">
          Have questions or feedback? We&apos;d love to hear from you.
        </p>
        <a
          href="mailto:support@bloomflow.app"
          className="inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          support@bloomflow.app
        </a>
      </section>

      <p className="mt-8 text-center">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-primary hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </p>
    </div>
  );
}
