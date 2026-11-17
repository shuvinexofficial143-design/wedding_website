"use client";
import { useState } from "react";
import type { WebsiteData } from "@/lib/website/schema";
export function GuestRsvp({
  token,
  events = [],
}: {
  token: string;
  events?: WebsiteData["events"];
}) {
  const [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <section className="section narrow" id="website-rsvp">
      <h2>Will you join us?</h2>
      <p>
        Your reply is visible only to the couple and their authorised invitation
        team.
      </p>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const f = new FormData(e.currentTarget);
          try {
            let requestId = localStorage.getItem("rsvp-" + token);
            if (!requestId) {
              requestId = crypto.randomUUID();
              localStorage.setItem("rsvp-" + token, requestId);
            }
            const r = await fetch("/api/invites/" + token + "/rsvp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: f.get("name"),
                attendance: f.get("attendance"),
                guests: Number(f.get("guests")),
                eventId: f.get("eventId") || "",
                notes: f.get("notes"),
                website: f.get("website"),
                requestId,
              }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error);
            setStatus("Thank you! Your RSVP has been received.");
          } catch (e) {
            setStatus((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Your name
          <input name="name" required maxLength={100} />
        </label>
        {events.length > 0 && (
          <label>
            Wedding function
            <select name="eventId">
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Attendance
          <select name="attendance">
            <option value="yes">Joyfully accepts</option>
            <option value="no">Regretfully declines</option>
          </select>
        </label>
        <label>
          Total guests
          <input
            name="guests"
            type="number"
            min={1}
            max={10}
            defaultValue={1}
          />
        </label>
        <label>
          Notes (optional)
          <textarea name="notes" maxLength={500} />
        </label>
        <input
          name="website"
          tabIndex={-1}
          aria-hidden="true"
          style={{ display: "none" }}
        />
        <button className="button" disabled={busy}>
          Send RSVP
        </button>
        <p role="status">{status}</p>
      </form>
      <button
        className="text-link"
        onClick={() =>
          window.open(
            "https://wa.me/?text=" + encodeURIComponent(location.href),
            "_blank",
            "noopener,noreferrer",
          )
        }
      >
        Share invitation on WhatsApp ↗
      </button>
    </section>
  );
}
