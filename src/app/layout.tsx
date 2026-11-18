import "@fontsource-variable/noto-sans";
import "@fontsource-variable/noto-serif-devanagari";
import type { Metadata } from "next";
import Link from "next/link";
import {LuxuryNav} from "@/components/luxury-nav";
import "./globals.css";
import "./luxury.css";
export const metadata: Metadata = {
  title: "Suhani Wedding Studio | Invitations with a little forever",
  description:
    "Discover beautifully crafted digital cards, animated invitations and wedding websites.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <div className="announcement">
          A beautiful beginning deserves a beautiful invitation.
        </div>
        <LuxuryNav/>
        <main>{children}</main>
        <Link
          href="/contact"
          className="button support-float"
          aria-label="Contact and WhatsApp support"
        >
          Need a hand? ↗
        </Link>
        <footer className="luxury-footer">
          <div className="brand">
            Suhani Wedding Studio<span>MADE FOR YOUR HAPPILY EVER AFTER</span>
          </div>
          <p>Thoughtful invitations. Unforgettable beginnings.</p><div className="footer-services"><Link href="/catalog?category=cards">Wedding cards</Link><Link href="/catalog?category=animated">Animated invitations</Link><Link href="/catalog?category=websites">Wedding websites</Link><Link href="/#how-it-works">How it works</Link></div>
          <div className="footer-links">
            <Link href="/contact">Support</Link>
            {["terms", "privacy", "refund", "delivery"].map((p) => (
              <Link key={p} href={`/policies/${p}`}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Link>
            ))}
          </div>
          <small>
            Launch preview · Sample prices · Payments not yet enabled
          </small>
        </footer>
      </body>
    </html>
  );
}
