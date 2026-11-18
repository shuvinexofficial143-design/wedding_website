"use client";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from "react";
import {
  sectionNames,
  type WebsiteData,
  type WebsiteTemplate,
} from "@/lib/website/schema";
import { uploadAsset } from "@/lib/upload-client";
import { WebsiteView } from "./website-view";
const subscribeReady = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
export function WebsiteEditor({
  orderId,
  template,
  initial,
  initialRevision,
  initialToken,
}: {
  orderId: string;
  template: WebsiteTemplate;
  initial: WebsiteData;
  initialRevision: number;
  initialToken: string | null;
}) {
  // Do not accept edits before React has attached controlled input handlers.
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady);
  const [data, setData] = useState(initial),
    [status, setStatus] = useState("Saved"),
    [busy, setBusy] = useState(false),
    [token, setToken] = useState(initialToken);
  const revision = useRef(initialRevision),
    latest = useRef(data),
    saved = useRef(JSON.stringify(initial)),
    inflight = useRef(false),
    conflict = useRef(false);
  useEffect(() => {
    latest.current = data;
  }, [data]);
  const save = useCallback(async () => {
    if (inflight.current || conflict.current) return false;
    const snapshot = latest.current,
      packed = JSON.stringify(snapshot);
    if (packed === saved.current) return true;
    inflight.current = true;
    setStatus("Saving…");
    try {
      const r = await fetch("/api/orders/" + orderId + "/website", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          revision: revision.current,
          data: snapshot,
        }),
      });
      const d = await r.json();
      if (r.status === 409) conflict.current = true;
      if (!r.ok) throw new Error(d.error);
      revision.current = d.revision;
      saved.current = packed;
      setStatus("Saved");
      return true;
    } catch (e) {
      setStatus((e as Error).message);
      return false;
    } finally {
      inflight.current = false;
    }
  }, [orderId]);
  useEffect(() => {
    const timer = setTimeout(() => void save(), 1000);
    return () => clearTimeout(timer);
  }, [data, save]);
  useEffect(() => {
    const timer = setInterval(() => {
      if (!inflight.current && JSON.stringify(latest.current) !== saved.current)
        void save();
    }, 2500);
    const unload = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(latest.current) !== saved.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", unload);
    return () => {
      clearInterval(timer);
      window.removeEventListener("beforeunload", unload);
    };
  }, [save]);
  async function publish(action: "publish" | "unpublish") {
    setBusy(true);
    try {
      if (!(await save()))
        throw new Error("Save your changes successfully before sharing.");
      const r = await fetch("/api/orders/" + orderId + "/website", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revision: revision.current }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      revision.current = result.revision;
      setToken(result.token);
      setStatus(
        action === "publish" ? "Published snapshot updated" : "Link revoked",
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function photo(file: File, gallery = false) {
    setBusy(true);
    try {
      const a = await uploadAsset(file, "photo");
      setData((d) =>
        gallery
          ? { ...d, gallery: [...d.gallery, a.url].slice(0, 12) }
          : { ...d, couplePhoto: a.url },
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section">
      <h1>Your wedding website</h1>
      <p>
        Self-service package · Changes save automatically. Publishing creates a
        separate guest snapshot. Anyone with the link can view the shared
        photos; unpublish revokes access.
      </p>
      <p role="status">{ready ? status : "Loading editor…"}</p>
      <fieldset
        disabled={!ready}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
        aria-label="Wedding website controls"
      >
        <div className="actions">
          <button
            className="button"
            disabled={busy}
            onClick={() => void save()}
          >
            Save website
          </button>
          <button
            className="button"
            disabled={busy}
            onClick={() => void publish("publish")}
          >
            {token ? "Update published website" : "Publish website"}
          </button>
          {token && (
            <>
              <a href={"/i/" + token} target="_blank" rel="noreferrer">
                Open guest website ↗
              </a>
              <button onClick={() => void publish("unpublish")}>
                Unpublish website
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      location.origin + "/i/" + token,
                    );
                    setStatus("Link copied");
                  } catch {
                    setStatus("Copy the link from Open guest website.");
                  }
                }}
              >
                Copy link
              </button>
            </>
          )}
        </div>
        <div className="website-editor-grid">
          <form className="form" onSubmit={(e) => e.preventDefault()}>
            {(
              [
                "partnerA",
                "partnerB",
                "introduction",
                "story",
                "message",
                "contact",
                "gifts",
              ] as const
            ).map((k) => (
              <label key={k}>
                {k}
                <textarea
                  aria-label={k}
                  value={data[k]}
                  maxLength={
                    k === "story"
                      ? 4000
                      : k === "partnerA" || k === "partnerB"
                        ? 100
                        : 600
                  }
                  onChange={(e) => setData({ ...data, [k]: e.target.value })}
                />
              </label>
            ))}
            <fieldset>
              <legend>Visible sections</legend>
              {sectionNames.map((s) => (
                <label key={s}>
                  <input
                    type="checkbox"
                    checked={data.sections.includes(s)}
                    disabled={!template.sections.includes(s)}
                    onChange={(e) =>
                      setData({
                        ...data,
                        sections: e.target.checked
                          ? [...data.sections, s]
                          : data.sections.filter((v) => v !== s),
                      })
                    }
                  />
                  {s}
                </label>
              ))}
            </fieldset>
            <label>
              Couple photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => {
                  if (e.target.files?.[0]) void photo(e.target.files[0]);
                }}
              />
            </label>
            {data.couplePhoto && (
              <button onClick={() => setData({ ...data, couplePhoto: "" })}>
                Remove couple photo
              </button>
            )}
            <label>
              Add gallery photo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy || data.gallery.length >= 12}
                onChange={(e) => {
                  if (e.target.files?.[0]) void photo(e.target.files[0], true);
                }}
              />
            </label>
            {data.gallery.map((p, i) => (
              <button
                key={p + i}
                onClick={() =>
                  setData({
                    ...data,
                    gallery: data.gallery.filter((_, j) => j !== i),
                  })
                }
              >
                Remove gallery photo {i + 1}
              </button>
            ))}
            <h2>Wedding functions</h2>
            {data.events.map((event, index) => (
              <fieldset key={event.id}>
                <legend>Event {index + 1}</legend>
                {(
                  ["name", "dateTime", "venue", "address", "maps"] as const
                ).map((k) => (
                  <label key={k}>
                    {k}
                    {k === "dateTime" && " (India time)"}
                    <input
                      type={k === "dateTime" ? "datetime-local" : "text"}
                      value={
                        k === "dateTime" ? event[k].slice(0, 16) : event[k]
                      }
                      onChange={(e) =>
                        setData({
                          ...data,
                          events: data.events.map((v) =>
                            v.id === event.id
                              ? {
                                  ...v,
                                  [k]:
                                    k === "dateTime"
                                      ? e.target.value + ":00+05:30"
                                      : e.target.value,
                                }
                              : v,
                          ),
                        })
                      }
                    />
                  </label>
                ))}
                <button
                  disabled={data.events.length === 1}
                  onClick={() =>
                    setData({
                      ...data,
                      events: data.events.filter((v) => v.id !== event.id),
                    })
                  }
                >
                  Remove event
                </button>
              </fieldset>
            ))}
            <button
              disabled={data.events.length >= 12}
              onClick={() =>
                setData({
                  ...data,
                  events: [
                    ...data.events,
                    {
                      id: crypto.randomUUID(),
                      name: [
                        "Haldi",
                        "Mehendi",
                        "Sangeet",
                        "Wedding",
                        "Reception",
                      ][data.events.length % 5],
                      dateTime: "2027-02-21T18:00:00+05:30",
                      venue: "",
                      address: "",
                      maps: "",
                    },
                  ],
                })
              }
            >
              Add event
            </button>
          </form>
          <WebsiteView template={template} data={data} />
        </div>
      </fieldset>
    </section>
  );
}
