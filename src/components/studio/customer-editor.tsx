"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import type { CardDocument } from "@/lib/studio/schema";
import { LayerCard } from "@/components/studio/layer-card";
import { uploadAsset } from "@/lib/upload-client";

export function CustomerStudioEditor({
  orderId, document: doc, templateVersion, initialValues, initialRevision,
}: {
  orderId: string;
  document: CardDocument;
  templateVersion: number;
  initialValues: Record<string, string>;
  initialRevision: number;
}) {
  const [values, setValues] = useState(initialValues);
  const [message, setMessage] = useState("All changes saved");
  const [busy, setBusy] = useState(false);
  const [layoutIssues, setLayoutIssues] = useState<string[]>([]);
  const revision = useRef(initialRevision);
  const current = useRef(values);
  const lastSaved = useRef(JSON.stringify(initialValues));
  const inflight = useRef<Promise<boolean> | null>(null);
  const conflicted = useRef(false);
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => { current.current = values; }, [values]);
  function change(key: string, value: string) {
    setValues(v => ({ ...v, [key]: value }));
    current.current = { ...current.current, [key]: value };
  }
  const save = useCallback(async () => {
    if (conflicted.current) return false;
    if (inflight.current) return inflight.current;
    if (JSON.stringify(current.current) === lastSaved.current) return true;
    const snapshot = { ...current.current };
    const run = async () => {
      setMessage("Saving…");
      try {
        const response = await fetch(`/api/orders/${orderId}/card`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ revision: revision.current, values: snapshot }),
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 409) conflicted.current = true;
          throw new Error(data.error || "Save failed");
        }
        revision.current = data.revision;
        lastSaved.current = JSON.stringify(snapshot);
        setMessage("All changes saved");
        return true;
      } catch (error) {
        setMessage((error as Error).message);
        return false;
      }
    };
    inflight.current = run();
    try { return await inflight.current; } finally { inflight.current = null; }
  }, [orderId]);
  useEffect(() => {
    if (JSON.stringify(values) === lastSaved.current || conflicted.current) return;
    const timer = setTimeout(() => { void save(); }, 1200);
    return () => clearTimeout(timer);
  }, [values, save]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!conflicted.current && JSON.stringify(current.current) !== lastSaved.current)
        void save();
    }, 5000);
    return () => clearInterval(timer);
  }, [save]);
  useEffect(() => {
    const listener = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(current.current) !== lastSaved.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, []);
  async function uploadPhoto(layerId: string, file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024) {
      setMessage("Upload a JPG, PNG or WebP image under 10 MB.");
      return;
    }
    setBusy(true);
    setMessage("Validating private photo…");
    try {
      const uploaded = await uploadAsset(file, "photo");
      change(layerId, uploaded.url);
      setMessage("Photo uploaded privately; save to apply it to your card.");
    } catch (error) {
      setMessage((error as Error).message);
    } finally { setBusy(false); }
  }
  async function exportFile(format: "png" | "pdf") {
    const root = preview.current?.querySelector(".layer-card") as HTMLDivElement | null;
    if (!root) return;
    setBusy(true);
    try {
      if (!(await save())) throw new Error("Please resolve the save error before downloading.");
      await document.fonts.ready;
      for (let index = 0; index < 80; index++) {
        if (root.getAttribute("data-export-ready") === "true") break;
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      if (root.getAttribute("data-export-ready") !== "true")
        throw new Error("Fonts are not ready. Retry the export.");
      if (root.getAttribute("data-overflow") === "true" || layoutIssues.length)
        throw new Error("Some text does not fit the card. Shorten it before downloading.");
      const images = Array.from(root.querySelectorAll("img"));
      await Promise.all(images.map(async image => {
        if (!image.complete) await new Promise<void>(resolve => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
        if (!image.naturalWidth) throw new Error("A background or photo failed to load.");
        await image.decode();
      }));
      const png = await toPng(root, {
        pixelRatio: Math.min(8, Math.max(2, 1800 / Math.max(root.clientWidth, 1))),
        cacheBust: true,
        filter: node => !(node instanceof HTMLElement && node.dataset.exportIgnore === "true"),
        style: { animation: "none", transition: "none" },
      });
      if (format === "png") {
        const link = document.createElement("a");
        link.href = png;
        link.download = "personalised-wedding-card.png";
        link.click();
      } else {
        const pageW = 148, pageH = pageW * doc.height / doc.width;
        const pdf = new jsPDF({
          orientation: doc.width > doc.height ? "landscape" : "portrait",
          unit: "mm",
          format: [pageW, pageH],
        });
        pdf.addImage(png, "PNG", 0, 0, pageW, pageH);
        pdf.save("personalised-wedding-card.pdf");
      }
      setMessage("Download ready");
    } catch (error) {
      setMessage((error as Error).message);
    } finally { setBusy(false); }
  }
  const editable = doc.layers.filter(l => l.editable && !l.hidden && l.kind !== "shape");
  return (
    <div className="editor-grid">
      <div className="form">
        <p className="notice">
          Your purchased card is fixed to template version {templateVersion}.
          Only fields enabled by the designer can be edited. Changes save automatically.
        </p>
        {editable.map(l => (
          <label key={l.id}>
            {l.label}
            {l.kind === "image" ? (
              <>
                <input type="file" accept="image/png,image/jpeg,image/webp"
                  aria-label={`Upload ${l.label}`}
                  disabled={busy}
                  onChange={e => { if (e.target.files?.[0]) void uploadPhoto(l.id, e.target.files[0]); }} />
                {values[l.id] && <button type="button" onClick={() => change(l.id, "")}>Remove {l.label}</button>}
              </>
            ) : l.maxLength > 140 || l.field === "cardMessage" ? (
              <textarea value={values[l.id] ?? ""} maxLength={l.maxLength}
                onChange={e => change(l.id, e.target.value)} />
            ) : (
              <input type="text" value={values[l.id] ?? ""} maxLength={l.maxLength}
                onChange={e => change(l.id, e.target.value)} />
            )}
          </label>
        ))}
        {!editable.length && <p className="notice">This template has no customer-editable layers.</p>}
        {layoutIssues.map(issue => <p key={issue} className="studio-warning">{issue}</p>)}
        <p role="status" aria-live="polite">{message}</p>
        <div className="actions">
          <button className="button" disabled={busy} onClick={() => void save()}>Save details</button>
          <button className="filter" disabled={busy} onClick={() => void exportFile("png")}>HD PNG</button>
          <button className="filter" disabled={busy} onClick={() => void exportFile("pdf")}>PDF</button>
        </div>
      </div>
      <div className="editor-preview">
        <div className="studio-customer-preview" ref={preview}>
          <LayerCard document={doc} values={values} onIssues={setLayoutIssues} />
        </div>
        <p style={{textAlign:"center",fontSize:12,marginTop:16}}>Live preview · Immutable purchased design v{templateVersion}</p>
      </div>
    </div>
  );
}
