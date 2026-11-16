"use client";
import { useState } from "react";
export function AdminOrder({ id, category }: { id: string; category: string }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          const fd = new FormData(e.currentTarget);
          const video = fd.get("video");
          let r: Response;
          if (video instanceof File && video.size) {
            r = await fetch(`/api/orders/${id}/video`, {
              method: "POST",
              body: fd,
            });
          } else {
            r = await fetch(`/api/admin/orders/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fulfillment: fd.get("fulfillment"),
                previewUrl: fd.get("previewUrl"),
                finalUrl: fd.get("finalUrl"),
                publish: fd.get("publish") === "on",
              }),
            });
          }
          const d = await r.json();
          if (!r.ok) throw new Error(d.error);
          setStatus("Order updated. Reload to view latest delivery details.");
        } catch (err) {
          setStatus((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Delivery status
        <select name="fulfillment">
          <option value="details_received">Details received</option>
          <option value="in_progress">In progress</option>
          <option value="preview_ready">Preview ready</option>
          <option value="delivered">Delivered</option>
        </select>
      </label>
      {category === "websites" && (
        <>
          <label>
            Preview URL
            <input name="previewUrl" type="url" placeholder="https://..." />
          </label>
          <label>
            Final URL
            <input name="finalUrl" type="url" placeholder="https://..." />
          </label>
          <label>
            <input name="publish" type="checkbox" />
            Publish submitted details as the final wedding website
          </label>
        </>
      )}
      {category === "videos" && (
        <label>
          Upload final MP4 (up to 50 MB)
          <input name="video" type="file" accept="video/mp4" />
        </label>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : "Update order"}
      </button>
      <p role="status">{status}</p>
    </form>
  );
}
