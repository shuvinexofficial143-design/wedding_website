/* Original, self-contained card artwork. Text remains real DOM text for accessibility, editing and export. */
/* eslint-disable @next/next/no-img-element */
type PremiumTheme = "royal-gold" | "floral-pink" | "traditional-indian";

export function isPremiumTheme(theme: string): theme is PremiumTheme {
  return ["royal-gold", "floral-pink", "traditional-indian"].includes(theme);
}

type CardProps = {
  theme: PremiumTheme;
  names: string[];
  date: string;
  venue: string;
  photo: string;
};

function formatWhen(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:\s*·\s*(\d{2}:\d{2}))?/);
  if (!match) return { day: value, time: "" };
  const date = new Date(match[1] + "T12:00:00Z");
  const day = Number.isNaN(date.getTime())
    ? match[1]
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
  if (!match[2]) return { day, time: "" };
  const [hour, minute] = match[2].split(":").map(Number);
  return {
    day,
    time: String(hour % 12 || 12) + ":" + String(minute).padStart(2, "0") +
      (hour < 12 ? " AM IST" : " PM IST"),
  };
}

function CouplePhoto({ src }: { src: string }) {
  return src ? <img className="premium-couple-photo" src={src} alt="Couple photograph" /> : null;
}

function RoyalCrest() {
  return (
    <svg className="royal-crest" viewBox="0 0 200 108" fill="none" aria-hidden="true">
      <path d="M22 79 Q61 74 66 35 L84 61 L100 16 L116 61 L134 35 Q139 74 178 79 L169 90 H31Z" stroke="currentColor" strokeWidth="2" />
      <path d="M36 88 Q100 103 164 88 M54 98 Q100 110 146 98" stroke="currentColor" />
      <circle cx="100" cy="14" r="5" fill="currentColor" />
      <circle cx="65" cy="32" r="4" fill="currentColor" />
      <circle cx="135" cy="32" r="4" fill="currentColor" />
      <path d="M100 69 l8 8 -8 8 -8 -8z M46 80 l5 5 -5 5 -5 -5z M154 80 l5 5 -5 5 -5 -5z" fill="currentColor" />
      <path d="M0 88h25 M175 88h25" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function FloralSpray() {
  return (
    <svg className="floral-spray-art" viewBox="0 0 270 230" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="floralPetal" cx="42%" cy="35%" r="80%">
          <stop stopColor="#fff7f5" />
          <stop offset=".6" stopColor="#d991a0" />
          <stop offset="1" stopColor="#b95e77" />
        </radialGradient>
        <linearGradient id="floralLeaf" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#a6b89a" /><stop offset="1" stopColor="#577866" />
        </linearGradient>
      </defs>
      <path d="M-8 216 Q83 123 185 15 M-8 186 Q108 178 226 78 M19 229 Q74 119 92 -8" stroke="#678575" strokeWidth="2.3" />
      {[
        [48, 158, -45], [90, 121, -25], [136, 72, -36], [183, 25, -50],
        [47, 207, 25], [111, 176, 18], [164, 126, 28], [219, 79, 22],
        [75, 53, -30], [31, 89, -60]
      ].map(([x, y, angle], i) => (
        <path key={i} d="M0 0 C-30 -27 -34 -48 -4 -40 C19 -32 15 -13 0 0Z"
          fill="url(#floralLeaf)" opacity=".84"
          transform={"translate(" + x + " " + y + ") rotate(" + angle + ")"} />
      ))}
      {[
        [49, 131, 35], [130, 91, 32], [193, 39, 31], [90, 191, 24],
        [217, 112, 21], [14, 204, 22]
      ].map(([x, y, r], i) => (
        <g key={i} transform={"translate(" + x + " " + y + ")"}>
          {[0, 60, 120, 180, 240, 300].map(a => (
            <ellipse key={a} cx="0" cy={-r * .47} rx={r * .43} ry={r * .66}
              fill="url(#floralPetal)" stroke="#bd7384" strokeOpacity=".2"
              transform={"rotate(" + a + ")"} />
          ))}
          <circle r={r * .28} fill="#e9c19a" />
          <circle r={r * .12} fill="#9f6c4b" />
        </g>
      ))}
      {[ [16,150], [155,167], [249,52], [75,22] ].map(([x,y],i) => (
        <g key={i} transform={"translate(" + x + " " + y + ")"} fill="#c88695">
          <circle r="6" /><circle cx="7" cy="-5" r="5" /><circle cx="-5" cy="-6" r="5" />
        </g>
      ))}
    </svg>
  );
}

function IndianToran() {
  return (
    <svg className="indian-toran" viewBox="0 0 420 138" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      <path d="M-4 4 H424" stroke="#b88324" strokeWidth="7" />
      <path d="M0 11 Q105 122 210 11 Q315 122 420 11" stroke="#b83a35" strokeWidth="6" fill="none" />
      <path d="M0 19 Q105 130 210 19 Q315 130 420 19" stroke="#d29a36" strokeWidth="3" fill="none" />
      {Array.from({ length: 17 }, (_, i) => {
        const x = i * 26.25;
        const y = i <= 8 ? 10 + 85 * Math.sin(Math.PI * i / 8) : 10 + 85 * Math.sin(Math.PI * (i - 8) / 8);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="9" fill="#e8a930" stroke="#c87d1c" strokeWidth="2" />
            <circle cx={x} cy={y} r="3" fill="#8b311f" />
            <path d={"M" + x + " " + (y + 7) + " l-8 12 l8 -4 l8 4Z"} fill="#64834e" />
          </g>
        );
      })}
      <path d="M210 8 v36" stroke="#b88324" strokeWidth="3" />
      <path d="M193 44 Q210 72 227 44Z" fill="#b53b32" stroke="#e9b44a" strokeWidth="2" />
      <circle cx="210" cy="42" r="5" fill="#edbc4b" />
    </svg>
  );
}

function IndianMandala() {
  return (
    <svg className="indian-mandala" viewBox="0 0 150 120" fill="none" aria-hidden="true">
      <circle cx="75" cy="61" r="39" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="75" cy="61" r="31" stroke="currentColor" strokeDasharray="3 5" />
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx="75" cy="31" rx="8" ry="20" stroke="currentColor" fill="#d7ad51"
          fillOpacity=".22" transform={"rotate(" + i * 30 + " 75 61)"} />
      ))}
      <path d="M57 73 Q75 42 93 73 Q75 93 57 73Z" fill="currentColor" fillOpacity=".22" />
      <path d="M75 42 Q94 60 75 81 Q56 60 75 42Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="75" cy="61" r="5" fill="currentColor" />
      <path d="M0 61h24 M126 61h24" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function PremiumCard({ theme, names, date, venue, photo }: CardProps) {
  const { day, time } = formatWhen(date);
  const first = names[0]?.trim() || "Your Name";
  const second = names[1]?.trim() || "Partner's Name";
  if (theme === "royal-gold") {
    return (
      <article className="premium-card premium-royal-gold" data-testid="premium-royal-gold" aria-label="Royal Gold Wedding Card">
        <div className="rg-corner rg-top-left" aria-hidden="true">✧</div>
        <div className="rg-corner rg-top-right" aria-hidden="true">✧</div>
        <div className="rg-corner rg-bottom-left" aria-hidden="true">✧</div>
        <div className="rg-corner rg-bottom-right" aria-hidden="true">✧</div>
        <div className="rg-outline" />
        <div className="rg-arch">
          <RoyalCrest />
          <p className="rg-kicker">A ROYAL CELEBRATION</p>
          <p className="rg-invitation">Together with our families, we invite you to the wedding of</p>
          <h2 className="premium-names rg-names"><span>{first}</span><em>&</em><span>{second}</span></h2>
          <CouplePhoto src={photo} />
          <div className="rg-filigree" aria-hidden="true"><span />✦<span /></div>
          <p className="rg-date">{day}</p>
          {time && <p className="rg-time">{time}</p>}
          <p className="rg-place">{venue}</p>
          <p className="rg-blessing">Your presence is our greatest blessing</p>
        </div>
        <p className="rg-footer">AN EVENING OF LOVE &amp; CELEBRATION</p>
      </article>
    );
  }
  if (theme === "floral-pink") {
    return (
      <article className="premium-card premium-floral-pink" data-testid="premium-floral-pink" aria-label="Floral Pink Wedding Card">
        <div className="floral-paper" />
        <div className="floral-top"><FloralSpray /></div>
        <div className="floral-bottom"><FloralSpray /></div>
        <div className="floral-inner">
          <p className="floral-kicker">THE WEDDING OF</p>
          <p className="floral-handwritten">A love in full bloom</p>
          <h2 className="premium-names floral-names"><span>{first}</span><em>&amp;</em><span>{second}</span></h2>
          <CouplePhoto src={photo} />
          <div className="floral-rule" aria-hidden="true"><span />❀<span /></div>
          <p className="floral-message">joyfully invite you to celebrate their wedding</p>
          <p className="floral-date">{day}</p>
          {time && <p className="floral-time">{time}</p>}
          <p className="floral-venue">{venue}</p>
          <p className="floral-ending">A beautiful beginning, together.</p>
        </div>
      </article>
    );
  }
  return (
    <article className="premium-card premium-traditional-indian" data-testid="premium-traditional-indian" aria-label="Traditional Indian Wedding Card">
      <div className="ti-frame" />
      <IndianToran />
      <div className="ti-content">
        <p className="ti-blessing">॥ श्री गणेशाय नमः ॥</p>
        <IndianMandala />
        <p className="ti-heading">शुभ विवाह</p>
        <p className="ti-invite">WITH THE BLESSINGS OF OUR FAMILIES</p>
        <h2 className="premium-names ti-names"><span>{first}</span><em>♥</em><span>{second}</span></h2>
        <CouplePhoto src={photo} />
        <p className="ti-announcement">REQUEST THE HONOUR OF YOUR PRESENCE</p>
        <div className="ti-date-container"><span>✦</span><div><strong>{day}</strong>{time && <small>{time}</small>}</div><span>✦</span></div>
        <p className="ti-venue">{venue}</p>
        <p className="ti-footer">मंगलमय शुभकामनाएँ</p>
      </div>
      <div className="ti-bottom-tile" aria-hidden="true">❖　❁　❖　❁　❖</div>
    </article>
  );
}
