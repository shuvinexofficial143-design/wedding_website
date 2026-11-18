import Link from "next/link";
import Image from "next/image";
import { catalogProducts } from "@/lib/studio/repository";
import { listAnimatedPublic } from "@/lib/animated/repository";
import { ProductTile, VideoTile } from "@/components/product-tile";
import { Invite } from "@/components/invite";
export const dynamic = "force-dynamic";
const collections = [
  [
    "Royal Heritage",
    "Regal details. Timeless romance.",
    "luxury-maroon-heritage",
  ],
  ["Floral Romance", "A little poetry in every petal.", "pink-rose-floral"],
  [
    "Indian Traditions",
    "For celebrations close to your heart.",
    "traditional-hindu-wedding",
  ],
  [
    "Nikah Collection",
    "Graceful. Meaningful. Beautiful.",
    "elegant-muslim-nikah",
  ],
  ["Minimal Luxury", "Simply, beautifully yours.", "white-gold-minimal"],
];
export default async function Home() {
  const [products, videos] = await Promise.all([
    catalogProducts(),
    listAnimatedPublic(),
  ]);
  const cards = products.filter((p) => p.category === "cards").slice(0, 4),
    motion = products.filter((p) => p.document.animation).slice(0, 3),
    sites = products.filter((p) => p.document.website).slice(0, 4);
  return (
    <div className="luxury-home">
      <section className="cinematic-hero">
        <Image
          className="hero-photo"
          src="/brand/wedding-editorial.webp"
          alt="Indian wedding couple in ivory and maroon beside gold-embossed invitation stationery"
          fill
          sizes="100vw"
          preload
        />
        <div className="hero-shade" />
        <div className="cinematic-copy">
          <span className="gold-ornament" aria-hidden="true">
            ── ❦ ──
          </span>
          <p className="eyebrow">A BEAUTIFUL BEGINNING, BEAUTIFULLY INVITED</p>
          <h1>
            For your forever.
            <br />
            <em>
              An invitation
              <br />
              to remember.
            </em>
          </h1>
          <p>
            Exquisite wedding cards, animated invitations
            <br className="desktop-break" /> and personal websites. Made for
            your love story.
          </p>
          <div className="actions">
            <Link className="button gold-button" href="/catalog">
              Browse Designs <span>↗</span>
            </Link>
            <Link className="button glass-button" href="/contact">
              Let’s create yours ↗
            </Link>
          </div>
          <div className="hero-assurance">
            ORIGINAL DESIGNS <span>✧</span> PERSONAL DETAILS <span>✧</span>{" "}
            BEAUTIFULLY SHARED
          </div>
        </div>
      </section>
      <div className="atelier-ribbon">
        <span>Made for Indian celebrations</span>
        <b>✧</b>
        <span>From your heart to their screen</span>
        <b>✧</b>
        <span>Your story, in every detail</span>
      </div>
      <section className="lux-section">
        <div className="lux-heading">
          <span className="eyebrow">FIND YOUR KIND OF BEAUTIFUL</span>
          <h2>
            Featured <em>Collections</em>
          </h2>
          <p>A world of beautiful beginnings. A design that feels like you.</p>
        </div>
        <div className="collection-strip">
          {collections
            .filter(([, , id]) => products.some((p) => p.id === id))
            .map(([name, copy, id]) => (
              <Link
                className="collection-tile"
                key={id}
                href={"/products/" + id}
              >
                <div className="collection-art">
                  <Invite theme={"art-" + id} />
                </div>
                <div>
                  <h3>
                    {name}
                    <span>↗</span>
                  </h3>
                  <p>{copy}</p>
                </div>
              </Link>
            ))}
        </div>
      </section>
      <section className="lux-section" id="wedding-cards">
        <div className="lux-heading split-heading">
          <div>
            <span className="eyebrow">A LITTLE PAPER MAGIC, REIMAGINED</span>
            <h2>
              Invitations to <em>cherish.</em>
            </h2>
          </div>
          <Link className="text-link" href="/catalog?category=cards">
            Explore all wedding cards ↗
          </Link>
        </div>
        <div className="product-grid home-card-grid">
          {cards.map((p) => (
            <ProductTile key={p.id} product={p} />
          ))}
        </div>
        <p className="quiet-note">
          Preview every design. Personalise after verified payment. Launch
          prices are provisional.
        </p>
      </section>
      <section className="blush-showcase">
        <div className="lux-section">
          <div className="lux-heading split-heading">
            <div>
              <span className="eyebrow">LET YOUR LOVE STORY COME ALIVE</span>
              <h2>
                A little motion.
                <br />
                <em>A lot of emotion.</em>
              </h2>
            </div>
            <div>
              <p>
                From a graceful reveal to a celebration in motion.
                <br />
                Find your own way to say “you’re invited”.
              </p>
              <Link className="text-link" href="/catalog?category=animated">
                Explore animated invitations ↗
              </Link>
            </div>
          </div>
          <div className="product-grid">
            {videos.slice(0, 3).map((p) => (
              <VideoTile key={p.id} product={p} />
            ))}
            {motion.slice(0, Math.max(0, 3 - videos.length)).map((p) => (
              <ProductTile key={p.id} product={p} />
            ))}
          </div>
          <p className="quiet-note">
            Animated web invitations share as a link. Studio video packages are
            personalised manually; see each design for delivery details.
          </p>
        </div>
      </section>
      <section className="lux-section" id="how-it-works">
        <div className="lux-heading">
          <span className="eyebrow">EFFORTLESS FROM THE VERY FIRST STEP</span>
          <h2>
            From “the one” to <em>everyone.</em>
          </h2>
        </div>
        <div className="journey-grid">
          {[
            [
              "01",
              "Choose your design",
              "Explore collections and open a full preview before choosing.",
              "✧",
            ],
            [
              "02",
              "Place your order",
              "Sign in and complete the secure sandbox checkout.",
              "▣",
            ],
            [
              "03",
              "Make it personal",
              "Edit supported designs or send details for a studio-made invitation.",
              "✎",
            ],
            [
              "04",
              "Share your joy",
              "Download your card, share a website or receive your finished video.",
              "↗",
            ],
          ].map(([n, t, d, icon]) => (
            <article key={n}>
              <div className="journey-icon" aria-hidden="true">
                {icon}
              </div>
              <small>STEP {n}</small>
              <h3>{t}</h3>
              <p>{d}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="website-showcase">
        <div className="lux-section">
          <div className="lux-heading">
            <span className="eyebrow">
              YOUR CELEBRATION. ONE BEAUTIFUL LINK.
            </span>
            <h2>
              A wedding website,
              <br />
              <em>as unique as your story.</em>
            </h2>
            <p>
              Your story, celebrations, gallery and RSVP—beautifully together.
            </p>
          </div>
          <div className="website-device-grid">
            {sites.map((p) => (
              <article key={p.id} className="website-device">
                <Link
                  href={"/preview/" + p.id}
                  aria-label={"Preview " + p.name}
                >
                  <div
                    className={
                      "laptop-screen device-" + p.document.website!.layout
                    }
                    style={{
                      background: p.document.website!.background,
                      color: p.document.website!.ink,
                    }}
                  >
                    <div className="mini-nav">
                      OUR STORY · EVENTS · GALLERY · RSVP
                    </div>
                    <span className="device-flower" aria-hidden="true">
                      ❦
                    </span>
                    <p>We’re getting married</p>
                    <h3>
                      Ananya <em>&</em> Aarav
                    </h3>
                    <span className="mini-date">21 FEBRUARY 2027 · JAIPUR</span>
                  </div>
                  <div className="laptop-base" />
                  <div
                    className="phone-preview"
                    style={{
                      background: p.document.website!.background,
                      color: p.document.website!.ink,
                    }}
                  >
                    <span>❦</span>
                    <b>
                      A <i>&</i> A
                    </b>
                    <small>OUR FOREVER</small>
                  </div>
                </Link>
                <h3>{p.name}</h3>
                <p>Self-service · ₹{p.price}</p>
                <Link className="button" href={"/products/" + p.id}>
                  View Website ↗
                </Link>
              </article>
            ))}
          </div>
          <p className="quiet-note">
            Illustrative device covers. Open each preview to explore the working
            layout.
          </p>
        </div>
      </section>
      <section className="lux-section">
        <div className="promise-band">
          {[
            [
              "✧",
              "Thoughtfully original",
              "Designs created for meaningful celebrations.",
            ],
            [
              "❦",
              "Personal by design",
              "Your names, your moments, your story.",
            ],
            [
              "♧",
              "Private & protected",
              "Personal details stay with your account.",
            ],
            ["↗", "Here to help", "Guidance from choosing to sharing."],
          ].map(([i, t, d]) => (
            <div key={t}>
              <span aria-hidden="true">{i}</span>
              <div>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="reviews-note">
          <div>
            <span className="eyebrow">WORDS FROM OUR COUPLES</span>
            <h2>
              Real stories.
              <br />
              <em>Honest impressions.</em>
            </h2>
          </div>
          <div>
            <p>
              Every celebration deserves care. We’ll share customer stories here
              when we have verified feedback and permission.
            </p>
            <p>No invented reviews. Just an invitation to explore our work.</p>
            <Link className="text-link" href="/catalog">
              See the designs for yourself ↗
            </Link>
          </div>
        </div>
      </section>
      <section className="lux-section faq-section">
        <div>
          <span className="eyebrow">A LITTLE CLARITY BEFORE YOUR BIG DAY</span>
          <h2>
            Your questions,
            <br />
            <em>lovingly answered.</em>
          </h2>
          <Link className="text-link" href="/contact">
            Have another question? ↗
          </Link>
        </div>
        <div className="faq-list">
          {[
            [
              "Can I preview a design before ordering?",
              "Yes. Every design has a preview. Explore the layout and product details before signing in to order.",
            ],
            [
              "Can I edit my invitation myself?",
              "Digital cards, animated web invitations and the four self-service website layouts unlock after server-verified payment. Studio video invitations are personalised by our team.",
            ],
            [
              "How long does delivery take?",
              "Digital editors unlock after verified payment. Managed animated orders have a 60-minute target after payment, subject to complete details. Managed wedding websites take 3–4 days after complete details. Check the chosen package.",
            ],
            [
              "Will I receive an MP4 video?",
              "Managed video packages can be delivered as a private MP4. Animated web templates are shareable pages and do not include MP4 export.",
            ],
            [
              "Are live payments available?",
              "This is a launch preview. Checkout uses Cashfree sandbox; live payments are not enabled.",
            ],
          ].map(([q, a]) => (
            <details key={q}>
              <summary>
                {q}
                <span aria-hidden="true">＋</span>
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="luxury-cta">
        <span className="gold-ornament" aria-hidden="true">
          ❦
        </span>
        <p className="eyebrow">YOUR FOREVER STARTS WITH A HELLO</p>
        <h2>
          Let’s make your first impression
          <br />
          <em>unforgettable.</em>
        </h2>
        <p>
          Tell us about your celebration. We’ll help you find its perfect
          invitation.
        </p>
        <Link className="button gold-button" href="/contact">
          Contact & WhatsApp support ↗
        </Link>
      </section>
    </div>
  );
}
