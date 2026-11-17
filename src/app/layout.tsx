import "@fontsource-variable/noto-sans";
import "@fontsource-variable/noto-serif-devanagari";
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: "The Wedding Edit | Invitations with a little forever",
  description:
    "Discover beautifully crafted digital cards, animated invitations and wedding websites.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <div className="announcement">
          A beautiful beginning deserves a beautiful invitation.
        </div>
        <header>
          <Link href="/" className="brand">
            the wedding edit<span>INVITATIONS & LITTLE FOREVERS</span>
          </Link>
          <nav aria-label="Main navigation">
            <Link href="/catalog">Collections</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/contact">Contact</Link>
            <Link className="nav-pill" href="/dashboard">
              My invitations ↗
            </Link>
          </nav>
        </header>
        <main>{children}</main>
        <Link
          href="/contact"
          className="button support-float"
          aria-label="Contact and WhatsApp support"
        >
          Need a hand? ↗
        </Link>
        <footer>
          <div className="brand">
            the wedding edit<span>MADE FOR YOUR HAPPILY EVER AFTER</span>
          </div>
          <p>Thoughtful invitations. Unforgettable beginnings.</p>
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
