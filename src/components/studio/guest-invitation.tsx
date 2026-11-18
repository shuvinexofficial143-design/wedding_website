"use client";
import { useState } from "react";
import type { CardDocument } from "@/lib/studio/schema";
import { LayerCard } from "./layer-card";

export function StudioGuestInvitation({
  document: doc, values, token,
}: {
  document: CardDocument;
  values: Record<string,string>;
  token: string;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="guest-page">
      <div className="guest-invite studio-customer-preview">
        <LayerCard
          document={doc}
          values={values}
          assetBasePath={`/api/invites/${token}/assets/`}
        />
      </div>
      <section className="guest-section">
        <span className="eyebrow">YOU ARE INVITED</span>
        <h1>{doc.name}</h1>
        <p>The invitation above is the exact card design and personalised details shared with you.</p>
      </section>
      <section className="guest-section">
        <span className="eyebrow">WE SAVED YOU A SEAT</span>
        <h2>Will you <i>join us?</i></h2>
        <p>Your RSVP is shared privately with the couple and their invitation team.</p>
        <form className="form" onSubmit={async event => {
          event.preventDefault();
          setBusy(true);
          const form = new FormData(event.currentTarget);
          try {
            const response = await fetch(`/api/invites/${token}/rsvp`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: form.get("name"),
                attendance: form.get("attendance"),
                guests: Number(form.get("guests")),
                website: form.get("website"),
              }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Unable to send RSVP");
            setStatus("Thank you! Your RSVP has been received.");
          } catch(error) {
            setStatus((error as Error).message);
          } finally { setBusy(false); }
        }}>
          <label>Your name<input name="name" required maxLength={100} /></label>
          <label>Will you attend?
            <select name="attendance">
              <option value="yes">Joyfully accepts</option>
              <option value="no">Regretfully declines</option>
            </select>
          </label>
          <label>Total guests including you
            <input type="number" name="guests" min={1} max={10} defaultValue={1} required />
          </label>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{display:"none"}} />
          <button className="button" disabled={busy}>{busy ? "Sending…" : "Send RSVP"}</button>
          <p role="status">{status}</p>
        </form>
      </section>
    </div>
  );
}
