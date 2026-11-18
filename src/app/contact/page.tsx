export default function Contact() {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  return (
    <section className="section narrow">
      <span className="eyebrow">HERE TO HELP</span>
      <h1>
        A little guidance.
        <br />
        <i>A lot of heart.</i>
      </h1>
      <p>
        Ask about designs, customisations, existing orders or delivery
        timelines.
      </p>
      {phone && /^\d{10,15}$/.test(phone) ? (
        <a
          className="button"
          href={`https://wa.me/${phone}?text=${encodeURIComponent("Hello! I would like help choosing a wedding invitation.")}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat on WhatsApp ↗
        </a>
      ) : (
        <div className="notice">
          Our support contact is being configured. Ordering is currently in
          sandbox testing; no live payments are accepted.
        </div>
      )}
      <h2>Before you order</h2>
      <p>
        Digital cards, animated web invitations and self-service wedding websites are
        editable after verified payment. Managed websites take 3–4 days after
        complete details. Studio video invitations are personalised manually.
      </p>
      <p>
        WhatsApp support is handled personally. Automated messaging is not connected.
      </p>
    </section>
  );
}
