import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "./providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.salvageme.org"),
  title: { default: "SalvageMe — Give books a second home", template: "%s | SalvageMe" },
  description:
    "SalvageMe connects people with books to give away with students, families, and schools who need them. Free, local, community-powered book exchange.",
  openGraph: {
    type: "website",
    siteName: "SalvageMe",
    title: "SalvageMe — Give books a second home",
    description: "A free, local, community-powered book exchange for educational equity.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </AppProviders>
      </body>
    </html>
  );
}
