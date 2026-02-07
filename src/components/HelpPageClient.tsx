"use client";

import { useState, useEffect, useRef } from "react";
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

const RED_FLAG_SYMPTOMS = [
  {
    symptom: "Severe pelvic or abdominal pain",
    advice: "Consult a doctor. Sudden or debilitating pain may indicate conditions that need evaluation.",
  },
  {
    symptom: "Very heavy bleeding (soaking a pad/tampon every 1–2 hours)",
    advice: "Consult a doctor. Heavy menstrual bleeding can signal anemia or other conditions.",
  },
  {
    symptom: "Periods that stop suddenly or become highly irregular",
    advice: "Consult a doctor. Significant changes in cycle pattern warrant medical review.",
  },
  {
    symptom: "Severe fatigue, dizziness, or fainting",
    advice: "Consult a doctor. These can indicate anemia, blood pressure issues, or other conditions.",
  },
  {
    symptom: "Fever with menstrual symptoms",
    advice: "Consult a doctor promptly. Fever can suggest infection (e.g., toxic shock syndrome).",
  },
  {
    symptom: "Severe mood changes affecting daily life",
    advice: "Consult a doctor or mental health professional. PMDD or other conditions may need support.",
  },
  {
    symptom: "Bleeding between periods or after menopause",
    advice: "Consult a doctor. Unexpected bleeding should be evaluated.",
  },
];

const CYCLE_SYNC_CITATIONS = [
  {
    title: "Effects of Menstrual Cycle Phase on Exercise Performance: Systematic Review and Meta-Analysis",
    authors: "McNamara et al.",
    journal: "Sports Medicine",
    year: "2020",
    url: "https://doi.org/10.1007/s40279-020-01319-3",
    note: "Reviewed cycle phase effects on exercise performance; found varied evidence, highlighting need for individual approaches.",
  },
  {
    title: "Menstrual Cycle Phase-Based Interval Training Yields Distinct Muscle Changes in Female Athletes",
    authors: "University of Copenhagen",
    journal: "medRxiv",
    year: "2024",
    url: "https://www.medrxiv.org/content/10.1101/2024.10.28.24316287v1",
    note: "Suggests cycle-phase tailoring may produce different physiological adaptations.",
  },
  {
    title: "Menstrual Cycle Phases Influence on Cardiorespiratory Response to Exercise in Endurance-Trained Females",
    authors: "Various authors",
    journal: "International Journal of Environmental Research and Public Health (MDPI)",
    year: "2021",
    url: "https://www.mdpi.com/1660-4601/18/3/860",
    note: "Examines how cycle phases affect cardiorespiratory responses during exercise.",
  },
];

type Tab = "faqs" | "safety";

export function HelpPageClient() {
  const [activeTab, setActiveTab] = useState<Tab>("faqs");
  const hasLoggedSafetyView = useRef(false);

  useEffect(() => {
    if (activeTab === "safety" && !hasLoggedSafetyView.current) {
      hasLoggedSafetyView.current = true;
      fetch("/api/help/safety-viewed", { method: "POST" }).catch(() => {});
    }
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <h1 className="mb-2 text-2xl font-semibold text-primary sm:text-3xl">
        Help & FAQs
      </h1>
      <p className="mb-6 text-foreground/80 text-sm sm:text-base">
        Answers to common questions about BloomFlow and cycle syncing.
      </p>

      <div className="mb-8 flex gap-2 border-b border-primary/20">
        <button
          onClick={() => setActiveTab("faqs")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "faqs"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/70 hover:text-foreground"
          }`}
        >
          FAQs
        </button>
        <button
          onClick={() => setActiveTab("safety")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "safety"
              ? "border-primary text-primary"
              : "border-transparent text-foreground/70 hover:text-foreground"
          }`}
        >
          Safety & Education
        </button>
      </div>

      {activeTab === "faqs" && (
        <section className="mb-12 space-y-6">
          <h2 className="text-lg font-semibold text-primary">Cycle Syncing</h2>
          <ul className="space-y-6">
            {FAQS.map((faq, i) => (
              <li
                key={i}
                className="rounded-xl border border-primary/20 bg-background/50 p-4 sm:p-6"
              >
                <h3 className="mb-2 font-medium text-foreground">{faq.q}</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {faq.a}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === "safety" && (
        <section className="space-y-10">
          {/* Red-flag symptoms */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">
              Red-Flag Symptoms — Consult a Doctor
            </h2>
            <p className="mb-4 text-sm text-foreground/80">
              BloomFlow is a wellness tool, not a medical device. If you
              experience any of the following, please consult a healthcare
              provider:
            </p>
            <ul className="space-y-4">
              {RED_FLAG_SYMPTOMS.map((item, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 sm:p-5"
                >
                  <h3 className="mb-1 font-medium text-neutral-900">
                    {item.symptom}
                  </h3>
                  <p className="text-sm text-rose-800/90">{item.advice}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Cycle-syncing science citations */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">
              Cycle-Syncing Science
            </h2>
            <p className="mb-4 text-sm text-foreground/80">
              Research on menstrual cycle and exercise is evolving. Here are
              peer-reviewed sources that inform our approach:
            </p>
            <ul className="space-y-4">
              {CYCLE_SYNC_CITATIONS.map((c, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-primary/20 bg-background/50 p-4 sm:p-5"
                >
                  <h3 className="mb-1 font-medium text-foreground">{c.title}</h3>
                  <p className="text-xs text-foreground/60 mb-2">
                    {c.authors} • {c.journal} ({c.year})
                  </p>
                  <p className="text-sm text-foreground/80 mb-2">{c.note}</p>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View source →
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-foreground/60">
              Evidence on cycle phase and exercise is mixed; individual
              responses vary. Use BloomFlow as a guide, not medical advice.
            </p>
          </div>

          {/* Data privacy */}
          <div>
            <h2 className="mb-4 text-lg font-semibold text-primary">
              Data Privacy
            </h2>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                <strong>What we collect:</strong> Your cycle data (last period
                start, average cycle length), fitness goal, daily check-ins
                (sleep, energy, stress, workouts), and consent preferences.
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                <strong>How we use it:</strong> Your data is used only to
                personalize BloomGuide AI suggestions and power your Body Garden.
                We do not sell your data.
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                <strong>Where it&apos;s stored:</strong> Data is stored securely
                in Supabase. You can revoke consent for personalization and
                anonymized research at any time.
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                <strong>Your control:</strong> You decide whether to share
                anonymized data to improve the app. Your identifiable data
                remains private and is never shared without your explicit
                consent.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mt-12 rounded-xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
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
