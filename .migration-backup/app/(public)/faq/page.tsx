import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about giving and requesting books on SalvageMe.",
};

// In production this copy should come from a CMS-backed config endpoint so
// it can change without a redeploy (flagged as a follow-up in the README).
const faqs = [
  {
    q: "Is SalvageMe free to use?",
    a: "Yes. There are no fees for listing, requesting, or exchanging books. SalvageMe is built to remove cost as a barrier to books.",
  },
  {
    q: "How do exchanges actually happen?",
    a: "Once a request is accepted, both people agree on a time and place — either directly, or at one of our community drop-off points like a local library.",
  },
  {
    q: "What if a listing turns out to be inappropriate or a no-show happens?",
    a: "Use the Report option on any listing or profile. Our team reviews every report and can suspend accounts that violate community guidelines.",
  },
  {
    q: "Can schools or libraries request in bulk?",
    a: "Yes — verified school and library accounts can request multiple listings and coordinate larger donations. Reach out via Settings once registered.",
  },
];

export default function FaqPage() {
  return (
    <div className="container-page max-w-2xl py-14">
      <h1 className="text-display-md">Frequently asked questions</h1>
      <dl className="mt-8 flex flex-col gap-6">
        {faqs.map((item) => (
          <div key={item.q}>
            <dt className="font-semibold text-ink-900">{item.q}</dt>
            <dd className="mt-1.5 text-sm text-ink-700/90">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
