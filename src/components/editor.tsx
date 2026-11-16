"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { Invite } from "./invite";
import { type Details } from "@/lib/validation";
export function Editor({
  id,
  theme,
  category,
  initial,
  initialRevision,
  initialToken,
}: {
  id: string;
  theme: string;
  category: string;
  initial: Details;
  initialRevision: number;
  initialToken: string | null;
}) {
  const [details, setDetails] = useState(initial);
  const [status, setStatus] = useState("All changes saved");
  const [token, setToken] = useState(initialToken);
  const [shareOrigin, setShareOrigin] = useState("");
  useEffect(() => { setShareOrigin(window.location.origin); }, []);
  const [busy, setBusy] = useState(false);
  const revision = useRef(initialRevision);
  const lastSaved = useRef(JSON.stringify(initial));
  const current = useRef(details);
  const saving = useRef(false);
  const conflict = useRef(false);
  const preview = useRef<HTMLDivElement>(null);
  const manual = ["websites", "videos"].includes(category);
  useEffect(() => {
    current.current = details;
  }, [details]);
  const save = useCallback(
    async (action = "save") => {
      if (saving.current || conflict.current) return false;
      saving.current = true;
      const snapshot = current.current;
      setStatus("Saving…");
      try {
        const r = await fetch(`/api/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            details: snapshot,
            revision: revision.current,
          }),
        });
        const data = await r.json();
        if (!r.ok) {
          if (r.status === 409) conflict.current = true;
          throw new Error(data.error);
        }
        revision.current = data.revision;
        lastSaved.current = JSON.stringify(snapshot);
        if (action === "publish") setToken(data.token);
        setStatus("All changes saved");
        return true;
      } catch (e) {
        setStatus((e as Error).message);
        return false;
      } finally {
        saving.current = false;
      }
    },
    [id],
  );
  useEffect(() => {
    if (JSON.stringify(details) === lastSaved.current) return;
    const timer = setTimeout(() => {
      void save();
    }, 1200);
    return () => clearTimeout(timer);
  }, [details, save]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (JSON.stringify(current.current) !== lastSaved.current) void save();
    }, 5000);
    return () => clearInterval(timer);
  }, [save]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(current.current) !== lastSaved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);
  const change = (key: keyof Details, value: string | string[]) =>
    setDetails((d) => ({ ...d, [key]: value }));
  async function photo(file: File): Promise<string> {
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    )
      throw new Error("Choose a JPG, PNG or WebP photo under 10 MB.");
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
    canvas.width = bitmap.width * scale;
    canvas.height = bitmap.height * scale;
    canvas
      .getContext("2d")!
      .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.8);
  }
  async function download(format: "png" | "pdf") {
    if (!preview.current) return;
    setBusy(true);
    try {
      if (!(await save())) return;
      const element = preview.current;
      await document.fonts.ready;
      await Promise.all(Array.from(element.querySelectorAll("img")).map(async image => {
        if (!image.complete) await new Promise<void>(resolve => { image.addEventListener("load", () => resolve(), { once: true }); image.addEventListener("error", () => resolve(), { once: true }); });
        if (!image.naturalWidth) throw new Error("An artwork or photo failed to load.");
      }));
      const png = await toPng(element, {
        pixelRatio: Math.max(3, 1800 / element.clientWidth),
        cacheBust: true,
        style: { animation: "none" },
      });
      if (format === "png") {
        const a = document.createElement("a");
        a.href = png;
        a.download = "wedding-invitation.png";
        a.click();
      } else {
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [148, 208],
        });
        pdf.addImage(png, "PNG", 0, 0, 148, 208);
        pdf.save("wedding-invitation.pdf");
      }
      setStatus("Download ready");
    } catch {
      setStatus("Export failed. Please retry in a supported browser.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="editor-grid">
      <div className="form">
        <p className="notice">
          {manual
            ? "Submit complete wedding details here. Your team will prepare and deliver your order through the dashboard."
            : "Your changes save automatically to your account. Publishing makes the saved details visible to anyone with your link."}
        </p>
        {(["partnerA", "partnerB", "date", "time", "venue"] as const).map(
          (key) => (
            <label key={key}>
              {
                {
                  partnerA: "Partner one",
                  partnerB: "Partner two",
                  date: "Wedding date",
                  time: "Wedding time (India)",
                  venue: "Venue",
                }[key]
              }
              <input
                type={
                  key === "date" ? "date" : key === "time" ? "time" : "text"
                }
                value={details[key]}
                maxLength={key === "venue" ? 200 : 70}
                onChange={(e) => change(key, e.target.value)}
              />
            </label>
          ),
        )}
        {category === "cards" && (
          <label>
            Venue address
            <input type="text" maxLength={180} value={details.address} onChange={(event) => change("address", event.target.value)} placeholder="Street, area, city, state, PIN code" />
          </label>
        )}
        {category === "cards" && (
          <label>
            Invitation message (up to 140 characters)
            <textarea maxLength={140} value={details.cardMessage} onChange={(e) => change("cardMessage", e.target.value)} />
          </label>
        )}
        <label>
          Your story
          <textarea
            value={details.story}
            maxLength={2000}
            onChange={(e) => change("story", e.target.value)}
          />
        </label>
        <label>
          Google Maps link
          <input
            type="url"
            value={details.maps}
            onChange={(e) => change("maps", e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
          />
        </label>
        <label>
          Couple photo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f)
                try {
                  change("photo", await photo(f));
                } catch (err) {
                  setStatus((err as Error).message);
                }
            }}
          />
        </label>
        {details.photo && (
          <button className="text-link" onClick={() => change("photo", "")}>
            Remove photo
          </button>
        )}
        <label>
          Gallery (up to 4 photos)
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={async (e) => {
              try {
                const files = Array.from(e.target.files || []);
                if (files.length > 4)
                  throw new Error("Choose up to four photos.");
                change("gallery", await Promise.all(files.map(photo)));
              } catch (err) {
                setStatus((err as Error).message);
              }
            }}
          />
        </label>
        <div>
          {details.gallery.map((src, i) => (
            <button
              key={i}
              title="Remove photo"
              onClick={() =>
                change(
                  "gallery",
                  details.gallery.filter((_, n) => n !== i),
                )
              }
            >
              <img
                className="photo-preview"
                src={src}
                alt={`Gallery photo ${i + 1}`}
              />
            </button>
          ))}
        </div>
        <p className="status" role="status" aria-live="polite">
          {status}
        </p>
        <div className="actions">
          <button
            disabled={busy}
            className="button"
            onClick={() => void save()}
          >
            Save details
          </button>
          {!manual && (
            <button
              disabled={busy}
              className="button"
              onClick={() => void save("publish")}
            >
              {token ? "Update published invitation" : "Publish shareable link"}
            </button>
          )}
          {category === "cards" && (
            <>
              <button
                className="filter"
                disabled={busy}
                onClick={() => void download("png")}
              >
                HD PNG
              </button>
              <button
                className="filter"
                disabled={busy}
                onClick={() => void download("pdf")}
              >
                PDF
              </button>
            </>
          )}
        </div>
        {token && (
          <div className="notice">
            <a className="text-link" href={`/i/${token}`} target="_blank">
              Open published invitation ↗
            </a>
            <p>
              <a
                className="text-link"
                href={`https://wa.me/?text=${encodeURIComponent(`You’re invited! ${shareOrigin}/i/${token}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Share on WhatsApp ↗
              </a>
            </p>
            <button
              className="text-link"
              onClick={async () => {
                if (saving.current) return;
                const r = await fetch(`/api/orders/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "unpublish" }),
                });
                if (r.ok) setToken(null);
                else setStatus("Unable to unpublish. Please retry.");
              }}
            >
              Unpublish link
            </button>
          </div>
        )}
      </div>
      <div className="editor-preview">
        <div ref={preview}>
          <Invite
            theme={theme}
            animated={category === "animated"}
            names={[details.partnerA, details.partnerB]}
            date={`${details.date} · ${details.time}`}
            venue={details.venue}
            photo={details.photo}
            message={details.cardMessage}
            address={details.address}
          />
        </div>
        <p style={{ textAlign: "center", fontSize: 11, marginTop: 20 }}>
          {manual
            ? "Style reference · Final work is prepared by our team"
            : "Live preview · Personalised with love"}
        </p>
      </div>
    </div>
  );
}
