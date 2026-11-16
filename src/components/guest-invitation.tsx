"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import { Invite } from "./invite";
import type { Details } from "@/lib/validation";
export function GuestInvitation({
  details,
  theme,
  animated,
  token,
}: {
  details: Details;
  theme: string;
  animated: boolean;
  token: string;
}) {
  const [countdown, setCountdown] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    function update() {
      const left =
        new Date(`${details.date}T${details.time}:00+05:30`).getTime() -
        Date.now();
      setCountdown(
        left <= 0
          ? "The celebration is here"
          : `${Math.floor(left / 86400000)} days · ${Math.floor(left / 3600000) % 24} hours · ${Math.floor(left / 60000) % 60} minutes`,
      );
    }
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [details.date, details.time]);
  return (
    <div className="guest-page">
      <div className="guest-invite">
        <Invite
          theme={theme}
          animated={animated}
          names={[details.partnerA, details.partnerB]}
          date={`${details.date} · ${details.time} IST`}
          venue={details.venue}
          photo={details.photo}
        />
      </div>
      <section className="guest-section">
        <span className="eyebrow">COUNTING DOWN TO FOREVER</span>
        <h2>{countdown || "A beautiful celebration awaits"}</h2>
        {details.story && (
          <p style={{ whiteSpace: "pre-wrap" }}>{details.story}</p>
        )}
        <h2>Join us at {details.venue}</h2>
        {details.maps && (
          <a
            className="button"
            href={details.maps}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open Google Maps ↗
          </a>
        )}
      </section>
      {details.gallery.length > 0 && (
        <section className="guest-section">
          <h2>
            Our little <i>moments.</i>
          </h2>
          <div className="gallery">
            {details.gallery.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`A memory of the couple, photo ${i + 1}`}
              />
            ))}
          </div>
        </section>
      )}
      <section className="guest-section">
        <span className="eyebrow">WE SAVED YOU A SEAT</span>
        <h2>
          Will you <i>join us?</i>
        </h2>
        <p>
          Your RSVP is shared privately with the couple and their invitation
          team.
        </p>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const fd = new FormData(e.currentTarget);
            try {
              const r = await fetch(`/api/invites/${token}/rsvp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: fd.get("name"),
                  attendance: fd.get("attendance"),
                  guests: Number(fd.get("guests")),
                  website: fd.get("website"),
                }),
              });
              const data = await r.json();
              if (!r.ok) throw new Error(data.error);
              setStatus("Thank you! Your RSVP has been received.");
            } catch (err) {
              setStatus((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Your name
            <input name="name" required maxLength={100} />
          </label>
          <label>
            Will you attend?
            <select name="attendance">
              <option value="yes">Joyfully accepts</option>
              <option value="no">Regretfully declines</option>
            </select>
          </label>
          <label>
            Total guests including you
            <input
              type="number"
              name="guests"
              min={1}
              max={10}
              defaultValue={1}
              required
            />
          </label>
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            style={{ display: "none" }}
          />
          <button className="button" disabled={busy}>
            {busy ? "Sending…" : "Send RSVP"}
          </button>
          <p role="status">{status}</p>
        </form>
      </section>
    </div>
  );
}
