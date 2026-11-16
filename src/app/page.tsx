import Link from "next/link";
import { Invite } from "@/components/invite";
import { categories, products } from "@/lib/catalog";
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">FOR THE BEGINNING OF YOUR FOREVER</span>
          <h1>
            Your love story.
            <br />
            An invitation
            <br />
            <i>to remember.</i>
          </h1>
          <p>
            Beautifully crafted digital invitations for your biggest little
            moment. Made personal. Shared with love.
          </p>
          <div className="actions">
            <Link className="button" href="/catalog">
              Find your invitation <span>↗</span>
            </Link>
            <Link className="text-link" href="/preview/gulmohar">
              Take a little peek →
            </Link>
          </div>
          <div className="hero-notes">
            <span>✧ Made for Indian celebrations</span>
            <span>♡ Yours, down to the details</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="sun-disc" />
          <div className="side-invite">
            <Invite theme="sage" />
          </div>
          <div className="main-invite">
            <Invite />
          </div>
          <span className="floating-label">
            A little you. A little magic. ✧
          </span>
          <span className="art-caption">THE GULMOHAR COLLECTION — 01</span>
        </div>
      </section>
      <div className="ribbon">
        <span>Made personal</span>✧<span>Beautiful on every screen</span>✧
        <span>Easy to share</span>✧<span>Memories worth keeping</span>
      </div>
      <section className="section">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              ONE CELEBRATION. SO MANY WAYS TO INVITE.
            </span>
            <h2>
              Find your kind of <i>beautiful.</i>
            </h2>
          </div>
          <p>
            From a simple card to your very own wedding website,
            <br />
            there’s a little something for every love story.
          </p>
        </div>
        <div className="services">
          {categories.map((c, i) => (
            <Link
              className="service"
              href={`/catalog?category=${c.id}`}
              key={c.id}
            >
              <span className="service-number">0{i + 1}</span>
              <span className="service-icon">{c.icon}</span>
              <h3>{c.name} ↗</h3>
              <p>{c.description}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="section collection">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              THOUGHTFULLY DESIGNED, LOVINGLY CHOSEN
            </span>
            <h2>
              A few of our <i>favourites.</i>
            </h2>
          </div>
          <Link className="text-link" href="/catalog">
            Explore the collection ↗
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 3).map((p) => (
            <Link className="product" href={`/products/${p.id}`} key={p.id}>
              <div className="product-art">
                <Invite theme={p.theme} />
                <span className="preview-chip">Explore design ↗</span>
              </div>
              <div className="product-meta">
                <div>
                  <small>{p.tag}</small>
                  <h3>{p.name}</h3>
                </div>
                <span>
                  ₹{p.price}
                  <small>Proposed price</small>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="section steps-section" id="how-it-works">
        <span className="eyebrow">LESS PLANNING. MORE CELEBRATING.</span>
        <h2>
          From “the one” to <i>everyone.</i>
        </h2>
        <div className="steps">
          {[
            [
              "01",
              "Fall in love with a design",
              "Explore the collections and preview every detail.",
            ],
            [
              "02",
              "Make it your own",
              "After verified payment, personalise your card. Our team handles websites and videos.",
            ],
            [
              "03",
              "Send a little happiness",
              "Download your card or share your finished invitation link.",
            ],
          ].map(([n, t, d]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="contact-banner">
        <span className="eyebrow">A LITTLE HELP, A LOT OF HEART</span>
        <h2>
          Let’s make something <i>beautiful.</i>
        </h2>
        <p>Need help choosing? We’ll help you find your perfect invitation.</p>
        <Link href="/contact" className="button">
          Talk to us ↗
        </Link>
      </section>
    </>
  );
}
