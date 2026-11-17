"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, type CSSProperties } from "react";
import {
  sampleWebsite,
  type WebsiteData,
  type WebsiteTemplate,
} from "@/lib/website/schema";
export function WebsiteView({
  template,
  data = sampleWebsite(),
  token,
}: {
  template: WebsiteTemplate;
  data?: WebsiteData;
  token?: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const next = data.events
    .map((e) => Date.parse(e.dateTime))
    .sort((a, b) => a - b)
    .find((t) => !now || t > now);
  const seconds =
    now && next ? Math.max(0, Math.floor((next - now) / 1000)) : 0;
  const image = (v: string) =>
    token ? v.replace("/api/assets/", "/api/invites/" + token + "/assets/") : v;
  const visible = (s: (typeof data.sections)[number]) =>
    data.sections.includes(s) && template.sections.includes(s);
  return (
    <article
      className={"wedding-site website-" + template.layout}
      style={
        {
          "--site-bg": template.background,
          "--site-ink": template.ink,
          "--site-accent": template.accent,
        } as CSSProperties
      }
    >
      <header className="website-hero">
        <p className="website-kicker">
          SUHANI WEDDING STUDIO · YOU ARE INVITED
        </p>
        <div className="website-mark" aria-hidden="true">
          {template.layout === "garden"
            ? "❦"
            : template.layout === "heritage"
              ? "✧"
              : template.layout === "celebration"
                ? "❋"
                : "01 / FOREVER"}
        </div>
        <h1>
          {data.partnerA}
          <em>&</em>
          {data.partnerB}
        </h1>
        <p>{data.introduction}</p>
        {data.couplePhoto && (
          <img
            className="website-portrait"
            src={image(data.couplePhoto)}
            alt="The couple"
            width={600}
            height={720}
          />
        )}
        <p className="website-countdown" aria-label="Wedding countdown">
          {now
            ? next
              ? Math.floor(seconds / 86400) +
                " days · " +
                (Math.floor(seconds / 3600) % 24) +
                " hours · " +
                (Math.floor(seconds / 60) % 60) +
                " minutes"
              : "Celebrating our special day"
            : "Counting down to our celebration"}
        </p>
        {token && (
          <a className="button" href="#website-rsvp">
            Join our celebration
          </a>
        )}
      </header>
      {visible("story") && (
        <section className="website-story">
          <span className="eyebrow">OUR STORY</span>
          <h2>
            A little about <i>us.</i>
          </h2>
          <p>{data.story}</p>
        </section>
      )}
      {visible("events") && (
        <section className="website-events">
          <span className="eyebrow">THE CELEBRATIONS</span>
          <h2>Be part of every moment</h2>
          <div>
            {data.events.map((e, i) => (
              <article key={e.id}>
                <span className="website-event-number">0{i + 1}</span>
                <h3>{e.name}</h3>
                <time dateTime={e.dateTime}>
                  {new Date(e.dateTime).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "long",
                    timeStyle: "short",
                  })}{" "}
                  IST
                </time>
                <h4>{e.venue}</h4>
                <p>{e.address}</p>
                {e.maps && (
                  <a href={e.maps} target="_blank" rel="noopener noreferrer">
                    Venue directions ↗
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
      {visible("gallery") && data.gallery.length > 0 && (
        <section className="website-gallery">
          <h2>Our favourite memories</h2>
          <div>
            {data.gallery.map((p, i) => (
              <img
                key={p + i}
                src={image(p)}
                alt={"Couple memory " + (i + 1)}
                loading="lazy"
                width={600}
                height={600}
              />
            ))}
          </div>
        </section>
      )}
      <section className="website-message">
        <p>{data.message}</p>
        {visible("contact") && data.contact && (
          <>
            <h3>Get in touch</h3>
            <p>{data.contact}</p>
          </>
        )}
        {visible("gifts") && data.gifts && (
          <>
            <h3>A note on gifts</h3>
            <p>{data.gifts}</p>
          </>
        )}
      </section>
    </article>
  );
}
