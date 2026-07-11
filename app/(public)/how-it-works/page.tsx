import type { Metadata } from "next";
import { PackageOpen, HandHeart, Handshake } from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works",
  description: "List a book, request one you need, and meet nearby to hand it off — three simple steps.",
};

const steps = [
  {
    icon: PackageOpen,
    title: "1. List what you have",
    body: "Snap a photo, add a quick description, and post it in a couple of minutes. Books sitting in a box help no one — SalvageMe gets them back in circulation.",
  },
  {
    icon: HandHeart,
    title: "2. Request what you need",
    body: "Search by subject, grade level, or condition. Found something? Send a short request explaining what it's for — a classroom, a home library, a student who needs it.",
  },
  {
    icon: Handshake,
    title: "3. Exchange, safely",
    body: "Agree on a time, or meet at a community drop-off point. Mark the exchange complete and leave a quick rating so the community stays trustworthy.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="container-page py-14">
      <h1 className="text-display-md text-center">How SalvageMe works</h1>
      <p className="mx-auto mt-3 max-w-xl text-center text-ink-700/90">
        Three simple steps, designed to work even on a slow connection.
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.title} className="text-center">
            <s.icon className="mx-auto mb-3 text-terracotta-500" size={32} aria-hidden="true" />
            <h2 className="text-display-sm">{s.title}</h2>
            <p className="mt-2 text-sm text-ink-700/90">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
