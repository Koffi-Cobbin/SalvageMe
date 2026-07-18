const FAQS = [
  {
    q: "Is SalvageMe free to use?",
    a: "Yes — completely. There are no fees for donors, recipients, or anyone in between. The only cost is your time and the willingness to help.",
  },
  {
    q: "How do I know the book I'm getting is in usable condition?",
    a: "Every listing includes a condition rating (New, Good, Fair, or Worn) and photos. If the item doesn't match what was listed, you can report the listing and we'll review it.",
  },
  {
    q: "Do I have to meet in person?",
    a: "Usually yes — SalvageMe is designed around community drop-off points and direct hand-offs. This keeps things simple, local, and free of shipping hassles.",
  },
  {
    q: "What if the other person doesn't show up?",
    a: "You can mark the exchange as a no-show. This is tracked and repeat offenders may lose the ability to participate. Rate the exchange so the community knows.",
  },
  {
    q: "Can I list any type of book?",
    a: "Any educational or recreational book in usable condition. We don't accept books with hate speech, explicit adult content, or damaged beyond legibility.",
  },
  {
    q: "What happens after I request a book?",
    a: "The donor receives your request. They can accept or decline. If accepted, an exchange is created and you'll coordinate a time and place for the hand-off.",
  },
  {
    q: "How does verification work?",
    a: "We verify accounts through a lightweight phone or email check. Verified users get a badge on their profile, signalling they're real community members.",
  },
  {
    q: "Can I list books for a school or organisation?",
    a: "Absolutely. Many donors list classroom sets. Just describe in the listing who the intended recipient is so people can self-select appropriately.",
  },
];

export function FaqPage() {
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="mb-2 text-display-md">Frequently asked questions</h1>
      <p className="mb-10 text-ink-700/70">
        Couldn&apos;t find your answer? Open any listing and use the Report button to reach us.
      </p>
      <dl className="flex flex-col divide-y divide-paper-300">
        {FAQS.map(({ q, a }) => (
          <div key={q} className="py-5">
            <dt className="font-semibold text-ink-900">{q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-ink-700/80">{a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
