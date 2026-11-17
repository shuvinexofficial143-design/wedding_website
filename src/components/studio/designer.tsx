"use client";
import { useState, useRef, useEffect } from "react";
import {
  newDocument,
  layerSchema,
  fontFamilies,
  layerFields,
  type CardDocument,
  type Layer,
  type TemplateDocument,
} from "@/lib/studio/schema";
import { clampLayer, collisionPairs } from "@/lib/studio/layout";
import { uploadAsset } from "@/lib/upload-client";
import { LayerCard } from "./layer-card";
import { TimelineEditor } from "../animation/timeline-editor";
export function Designer({
  initial,
  id: initialId,
  revision: initialRevision = 1,
  style: initialStyle = "",
  history: initialHistory = [],
  featured: initialFeatured = false,
  sortOrder = 0,
}: {
  initial?: TemplateDocument;
  id?: string;
  revision?: number;
  style?: string;
  history?: number[];
  featured?: boolean;
  sortOrder?: number;
}) {
  const base =
    initial?.renderer === "legacy"
      ? {
          ...newDocument(),
          name: initial.name,
          description: initial.description,
          pricePaise: initial.pricePaise,
          category: initial.category,
        }
      : initial || newDocument();
  const {
    renderer: _renderer,
    legacyTheme: _theme,
    legacyProduct: _product,
    legacyArtwork: _art,
    ...clean
  } = base as TemplateDocument;
  void _renderer;
  void _theme;
  void _product;
  void _art;
  const [doc, setDoc] = useState<CardDocument>(clean);
  const [id, setId] = useState(initialId);
  const [revision, setRevision] = useState(initialRevision);
  const [style, setStyle] = useState(initialStyle);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(50);
  const [snap, setSnap] = useState(true);
  const [guides, setGuides] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [issues, setIssues] = useState<string[]>([]);
  const [history, setHistory] = useState(initialHistory);
  const [featured, setFeatured] = useState(initialFeatured);
  const [sort, setSort] = useState(sortOrder);
  const undo = useRef<CardDocument[]>([]),
    redo = useRef<CardDocument[]>([]);
  const dirty = useRef(false);
  const canvas = useRef<HTMLDivElement>(null);
  const gesture = useRef<{
    x: number;
    y: number;
    layer: Layer;
    doc: CardDocument;
    resize: boolean;
  } | null>(null);
  const layer = doc.layers.find((l) => l.id === selected);
  const collisions = collisionPairs(doc.layers);
  function update(next: CardDocument, record = true) {
    if (record) {
      undo.current.push(doc);
      if (undo.current.length > 100) undo.current.shift();
      redo.current = [];
    }
    dirty.current = true;
    setDoc(next);
  }
  function patchLayer(patch: Partial<Layer>) {
    if (!layer) return;
    update({
      ...doc,
      layers: doc.layers.map((l) =>
        l.id === layer.id ? clampLayer({ ...l, ...patch }, doc) : l,
      ),
    });
  }
  function add(kind: Layer["kind"], field: Layer["field"] = "custom") {
    const l = layerSchema.parse({
      id: crypto.randomUUID(),
      kind,
      label:
        kind === "text"
          ? field === "custom"
            ? "Custom text"
            : field
          : kind === "image"
            ? "Image"
            : "Shape",
      field,
      editable: field !== "custom",
      value:
        kind === "text" && field === "custom" ? "Your invitation text" : "",
      x: doc.safeInset + 20,
      y: Math.min(
        doc.height - 150 - doc.safeInset,
        150 + doc.layers.length * 90,
      ),
      width: doc.width - 2 * doc.safeInset - 40,
      height: kind === "text" ? 80 : 180,
      zIndex: doc.layers.length,
      fontSize: field.includes("partner") ? 64 : 32,
    });
    update({ ...doc, layers: [...doc.layers, clampLayer(l, doc)] });
    setSelected(l.id);
  }
  function travel(back: boolean) {
    const from = back ? undo : redo,
      to = back ? redo : undo;
    const next = from.current.pop();
    if (next) {
      to.current.push(doc);
      setDoc(next);
      dirty.current = true;
    }
  }
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", listener);
    return () => window.removeEventListener("beforeunload", listener);
  }, []);
  async function save() {
    setBusy(true);
    try {
      const r = await fetch(
        id ? `/api/admin/cards/${id}` : "/api/admin/cards",
        {
          method: id ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            id
              ? { action: "save", revision, document: doc }
              : { styleNumber: style, document: doc },
          ),
        },
      );
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      setId(result.id || id);
      if (result.id && !id)
        window.history.replaceState(null, "", `/admin/cards/${result.id}`);
      setRevision(result.revision);
      setHistory((h) => [
        result.version,
        ...h.filter((n) => n !== result.version),
      ]);
      dirty.current = false;
      setMessage(
        `Saved version ${result.version}. Reload will retain this design.`,
      );
      return result.id || id;
    } catch (e) {
      setMessage((e as Error).message);
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function publish(action: string) {
    if (!id || dirty.current) {
      setMessage("Save your design first, then publish.");
      return;
    }
    if (action === "published" && (issues.length || collisions.length)) {
      setMessage("Resolve text overflow/collisions before publishing.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/cards/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, revision, featured, sortOrder: sort }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRevision(d.revision);
      setMessage(
        `Template ${action}. Existing purchases retain their original version.`,
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(
    file: File,
    purpose: "background" | "thumbnail" | "decoration",
  ) {
    setBusy(true);
    try {
      const a = await uploadAsset(file, purpose);
      if (purpose === "decoration") patchLayer({ assetId: a.id });
      else
        update({
          ...doc,
          [purpose === "background" ? "backgroundAssetId" : "thumbnailAssetId"]:
            a.id,
        });
      setMessage("Image validated and saved.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="studio-shell">
      <div className="studio-toolbar">
        <strong>Card Design Studio</strong>
        <button onClick={() => travel(true)}>Undo</button>
        <button onClick={() => travel(false)}>Redo</button>
        <label>
          Zoom{" "}
          <input
            aria-label="Zoom"
            type="range"
            min={20}
            max={100}
            value={zoom}
            onChange={(e) => setZoom(+e.target.value)}
          />
          {zoom}%
        </label>
        <label>
          <input
            type="checkbox"
            checked={snap}
            onChange={(e) => setSnap(e.target.checked)}
          />{" "}
          Snap 10px
        </label>
        <label>
          <input
            type="checkbox"
            checked={guides}
            onChange={(e) => setGuides(e.target.checked)}
          />{" "}
          Safe area / guides
        </label>
        <button className="button" disabled={busy} onClick={() => void save()}>
          Save design
        </button>
        <button
          className="button"
          disabled={busy || !id}
          onClick={() => void publish("published")}
        >
          Publish
        </button>
      </div>
      <div className="studio-body">
        <aside className="studio-panel">
          <h2>Design</h2>
          <TimelineEditor
            document={doc}
            selected={selected}
            onChange={update}
          />
          <button
            type="button"
            onClick={() => {
              setId(undefined);
              setStyle("");
              setRevision(1);
              setHistory([]);
              update({ ...doc, name: `${doc.name} copy` });
              window.history.replaceState(null, "", "/admin/cards/new");
              setMessage(
                "Duplicate ready. Enter a unique style number and save.",
              );
            }}
          >
            Duplicate as new template
          </button>
          {initial?.renderer === "legacy" && (
            <p className="notice">
              This existing card remains unchanged for customers. Saving here
              creates a new layered version; original purchased versions are
              preserved.
            </p>
          )}
          <label>
            Card name
            <input
              value={doc.name}
              onChange={(e) => update({ ...doc, name: e.target.value })}
            />
          </label>
          <label>
            Unique style number
            <input
              value={style}
              disabled={!!id}
              onChange={(e) => setStyle(e.target.value.toUpperCase())}
              placeholder="WED-001"
            />
          </label>
          <label>
            Price (₹)
            <input
              type="number"
              min={0}
              value={doc.pricePaise / 100}
              onChange={(e) =>
                update({
                  ...doc,
                  pricePaise: Math.round(+e.target.value * 100),
                })
              }
            />
          </label>
          <label>
            Description
            <textarea
              value={doc.description}
              onChange={(e) => update({ ...doc, description: e.target.value })}
            />
          </label>
          <label>
            Tags / categories
            <input
              value={doc.tags.join(", ")}
              onChange={(e) =>
                update({
                  ...doc,
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <label>
            Orientation / ratio
            <select
              onChange={(e) => {
                const [width, height] = e.target.value.split(":").map(Number);
                update({
                  ...doc,
                  width,
                  height,
                  layers: doc.layers.map((l) =>
                    clampLayer(l, { ...doc, width, height }),
                  ),
                });
              }}
              value={`${doc.width}:${doc.height}`}
            >
              <option value="1000:1400">Portrait 5:7</option>
              <option value="1400:1000">Landscape 7:5</option>
              <option value="1000:1000">Square 1:1</option>
              <option value="900:1600">Story 9:16</option>
            </select>
          </label>
          <label>
            Safe inset
            <input
              type="number"
              value={doc.safeInset}
              min={0}
              max={200}
              onChange={(e) => {
                const safeInset = +e.target.value;
                update({
                  ...doc,
                  safeInset,
                  layers: doc.layers.map((l) =>
                    clampLayer(l, { ...doc, safeInset }),
                  ),
                });
              }}
            />
          </label>
          <label>
            Background color
            <input
              type="color"
              value={doc.backgroundColor}
              onChange={(e) =>
                update({ ...doc, backgroundColor: e.target.value })
              }
            />
          </label>
          <label>
            Background artwork
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                if (e.target.files?.[0])
                  void upload(e.target.files[0], "background");
              }}
            />
          </label>
          <label>
            Thumbnail
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                if (e.target.files?.[0])
                  void upload(e.target.files[0], "thumbnail");
              }}
            />
          </label>
          <label>
            Sort order
            <input
              type="number"
              value={sort}
              onChange={(e) => setSort(+e.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured
          </label>
          <div className="studio-actions">
            <button
              disabled={!id || busy}
              onClick={() => void publish("unpublished")}
            >
              Unpublish
            </button>
            <button
              disabled={!id || busy}
              onClick={() => void publish("archived")}
            >
              Archive
            </button>
          </div>
          <h3>Version history</h3>
          {history.map((v) => (
            <button
              key={v}
              onClick={async () => {
                if (
                  dirty.current &&
                  !confirm("Replace unsaved canvas with this saved version?")
                )
                  return;
                const r = await fetch(`/api/admin/cards/${id}?version=${v}`);
                const data = await r.json();
                if (data.document?.renderer === "layers") {
                  const { renderer, ...d } = data.document;
                  void renderer;
                  update(d);
                  setMessage(
                    `Loaded version ${v}. Save to create a new version; no history is overwritten.`,
                  );
                }
              }}
            >
              Version {v}
            </button>
          ))}
        </aside>
        <div className="studio-workspace">
          <div className="studio-add">
            <button onClick={() => add("text", "partnerA")}>
              + Bride name
            </button>
            <button onClick={() => add("text", "partnerB")}>
              + Groom name
            </button>
            <button onClick={() => add("text", "date")}>+ Date</button>
            <button onClick={() => add("text", "time")}>+ Time</button>
            <button onClick={() => add("text", "venue")}>+ Venue</button>
            <button onClick={() => add("text", "address")}>+ Address</button>
            <button onClick={() => add("text", "cardMessage")}>
              + Message
            </button>
            <button onClick={() => add("text")}>+ Text</button>
            <button onClick={() => add("image", "photo")}>
              + Couple photo
            </button>
            <button onClick={() => add("image")}>+ Decoration</button>
            <button onClick={() => add("shape")}>+ Shape</button>
          </div>
          <div className="studio-scroll">
            <div
              ref={canvas}
              className="studio-canvas"
              style={{
                width: (doc.width * zoom) / 100,
                height: (doc.height * zoom) / 100,
              }}
              onPointerMove={(e) => {
                const g = gesture.current;
                if (!g) return;
                const scale =
                  (canvas.current?.getBoundingClientRect().width || 1) /
                  doc.width;
                const dx = (e.clientX - g.x) / scale,
                  dy = (e.clientY - g.y) / scale;
                const grid = (n: number) =>
                  snap ? Math.round(n / 10) * 10 : n;
                const next = clampLayer(
                  {
                    ...g.layer,
                    ...(g.resize
                      ? {
                          width: grid(g.layer.width + dx),
                          height: grid(g.layer.height + dy),
                        }
                      : { x: grid(g.layer.x + dx), y: grid(g.layer.y + dy) }),
                  },
                  doc,
                );
                setDoc({
                  ...g.doc,
                  layers: g.doc.layers.map((l) =>
                    l.id === next.id ? next : l,
                  ),
                });
                dirty.current = true;
              }}
              onPointerUp={() => {
                if (gesture.current) {
                  undo.current.push(gesture.current.doc);
                  redo.current = [];
                  gesture.current = null;
                }
              }}
              onPointerCancel={() => {
                gesture.current = null;
              }}
            >
              <LayerCard document={doc} onIssues={setIssues} />
              {guides && (
                <div
                  className="studio-safe"
                  style={{
                    inset: `${(doc.safeInset / doc.height) * 100}% ${(doc.safeInset / doc.width) * 100}%`,
                  }}
                />
              )}
              {guides && (
                <>
                  <div className="studio-guide-v" />
                  <div className="studio-guide-h" />
                </>
              )}
              {doc.layers
                .filter((l) => !l.hidden)
                .map((l) => (
                  <div
                    key={l.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${l.label}`}
                    data-testid={`handle-${l.id}`}
                    className={`studio-hit ${selected === l.id ? "selected" : ""} ${l.locked ? "locked" : ""}`}
                    style={{
                      left: `${(l.x / doc.width) * 100}%`,
                      top: `${(l.y / doc.height) * 100}%`,
                      width: `${(l.width / doc.width) * 100}%`,
                      height: `${(l.height / doc.height) * 100}%`,
                      transform: `rotate(${l.rotation}deg)`,
                      zIndex: 1000 + l.zIndex,
                    }}
                    onClick={() => setSelected(l.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") setSelected(l.id);
                      if (
                        !l.locked &&
                        [
                          "ArrowUp",
                          "ArrowDown",
                          "ArrowLeft",
                          "ArrowRight",
                        ].includes(e.key)
                      ) {
                        e.preventDefault();
                        setSelected(l.id);
                        const step = e.shiftKey ? 10 : 1;
                        update({
                          ...doc,
                          layers: doc.layers.map((v) =>
                            v.id === l.id
                              ? clampLayer(
                                  {
                                    ...v,
                                    x:
                                      v.x +
                                      (e.key === "ArrowRight"
                                        ? step
                                        : e.key === "ArrowLeft"
                                          ? -step
                                          : 0),
                                    y:
                                      v.y +
                                      (e.key === "ArrowDown"
                                        ? step
                                        : e.key === "ArrowUp"
                                          ? -step
                                          : 0),
                                  },
                                  doc,
                                )
                              : v,
                          ),
                        });
                      }
                    }}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelected(l.id);
                      if (l.locked) return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      gesture.current = {
                        x: e.clientX,
                        y: e.clientY,
                        layer: l,
                        doc,
                        resize:
                          (e.target as HTMLElement).dataset.resize === "true",
                      };
                    }}
                  >
                    {selected === l.id && (
                      <>
                        <span className="studio-layer-label">{l.label}</span>
                        {!l.locked && (
                          <span
                            className="studio-resize"
                            data-resize="true"
                            aria-label="Resize layer"
                          />
                        )}
                      </>
                    )}
                  </div>
                ))}
            </div>
          </div>
          <p role="status" className="status">
            {message}
          </p>
          {issues.map((i) => (
            <p className="studio-warning" key={i}>
              {i}
            </p>
          ))}
          {collisions.map((c, i) => (
            <p className="studio-warning" key={i}>
              Collision: {c.join(" / ")}
            </p>
          ))}
        </div>
        <aside className="studio-panel">
          <h2>Layers</h2>
          <div className="studio-layers">
            {[...doc.layers]
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((l) => (
                <button
                  key={l.id}
                  className={selected === l.id ? "active" : ""}
                  onClick={() => setSelected(l.id)}
                >
                  {l.hidden ? "◌" : "◉"} {l.label} {l.locked ? "🔒" : ""}
                </button>
              ))}
          </div>
          {layer ? (
            <>
              <h3>Layer properties</h3>
              <label>
                Layer label
                <input
                  value={layer.label}
                  onChange={(e) => patchLayer({ label: e.target.value })}
                />
              </label>
              <label>
                Customer field
                <select
                  value={layer.field}
                  onChange={(e) =>
                    patchLayer({ field: e.target.value as Layer["field"] })
                  }
                >
                  {layerFields.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layer.editable}
                  disabled={layer.kind === "shape"}
                  onChange={(e) => patchLayer({ editable: e.target.checked })}
                />
                Customer editable
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layer.locked}
                  onChange={(e) => patchLayer({ locked: e.target.checked })}
                />
                Lock position
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={layer.hidden}
                  onChange={(e) => patchLayer({ hidden: e.target.checked })}
                />
                Hide layer
              </label>
              <div className="studio-properties">
                {(
                  [
                    "x",
                    "y",
                    "width",
                    "height",
                    "rotation",
                    "opacity",
                    "zIndex",
                  ] as const
                ).map((k) => (
                  <label key={k}>
                    {k}
                    <input
                      aria-label={k}
                      type="number"
                      step={k === "opacity" ? 0.1 : 1}
                      value={layer[k]}
                      disabled={
                        layer.locked &&
                        ["x", "y", "width", "height", "rotation"].includes(k)
                      }
                      onChange={(e) => patchLayer({ [k]: +e.target.value })}
                    />
                  </label>
                ))}
              </div>
              {layer.kind === "text" && (
                <>
                  <label>
                    Default / custom text
                    <textarea
                      value={layer.value}
                      maxLength={layer.maxLength}
                      onChange={(e) => patchLayer({ value: e.target.value })}
                    />
                  </label>
                  <label>
                    Font
                    <select
                      value={layer.fontFamily}
                      onChange={(e) =>
                        patchLayer({
                          fontFamily: e.target.value as Layer["fontFamily"],
                        })
                      }
                    >
                      {fontFamilies.map((f) => (
                        <option key={f}>{f}</option>
                      ))}
                    </select>
                  </label>
                  {(
                    [
                      "fontSize",
                      "fontWeight",
                      "lineHeight",
                      "letterSpacing",
                      "maxLength",
                    ] as const
                  ).map((k) => (
                    <label key={k}>
                      {k}
                      <input
                        type="number"
                        value={layer[k]}
                        step={k === "lineHeight" ? 0.1 : 1}
                        onChange={(e) => patchLayer({ [k]: +e.target.value })}
                      />
                    </label>
                  ))}
                  <label>
                    Text color
                    <input
                      type="color"
                      value={layer.color}
                      onChange={(e) => patchLayer({ color: e.target.value })}
                    />
                  </label>
                  <label>
                    Alignment
                    <select
                      value={layer.align}
                      onChange={(e) =>
                        patchLayer({ align: e.target.value as Layer["align"] })
                      }
                    >
                      <option>left</option>
                      <option>center</option>
                      <option>right</option>
                    </select>
                  </label>
                </>
              )}
              {layer.kind === "image" && (
                <label>
                  Decorative image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={(e) => {
                      if (e.target.files?.[0])
                        void upload(e.target.files[0], "decoration");
                    }}
                  />
                </label>
              )}
              {layer.kind === "shape" && (
                <>
                  <label>
                    Shape
                    <select
                      value={layer.shape}
                      onChange={(e) =>
                        patchLayer({ shape: e.target.value as Layer["shape"] })
                      }
                    >
                      <option>rectangle</option>
                      <option>ellipse</option>
                    </select>
                  </label>
                  <label>
                    Border color
                    <input
                      type="color"
                      value={layer.borderColor}
                      onChange={(e) =>
                        patchLayer({ borderColor: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Border width
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={layer.borderWidth}
                      onChange={(e) =>
                        patchLayer({ borderWidth: +e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Fill
                    <input
                      type="color"
                      value={layer.fill}
                      onChange={(e) => patchLayer({ fill: e.target.value })}
                    />
                  </label>
                </>
              )}
              <div className="studio-actions">
                <button
                  onClick={() => {
                    const copy = {
                      ...layer,
                      id: crypto.randomUUID(),
                      label: `${layer.label} copy`,
                      zIndex: layer.zIndex + 1,
                    };
                    update({
                      ...doc,
                      layers: [
                        ...doc.layers,
                        clampLayer(
                          { ...copy, x: copy.x + 20, y: copy.y + 20 },
                          doc,
                        ),
                      ],
                    });
                    setSelected(copy.id);
                  }}
                >
                  Duplicate
                </button>
                <button
                  onClick={() =>
                    patchLayer({ zIndex: Math.min(999, layer.zIndex + 1) })
                  }
                >
                  Forward
                </button>
                <button
                  onClick={() =>
                    patchLayer({ zIndex: Math.max(0, layer.zIndex - 1) })
                  }
                >
                  Backward
                </button>
                <button
                  onClick={() => {
                    update({
                      ...doc,
                      layers: doc.layers.filter((l) => l.id !== layer.id),
                      animation: doc.animation
                        ? {
                            ...doc.animation,
                            tracks: doc.animation.tracks.filter(
                              (t) => t.layerId !== layer.id,
                            ),
                          }
                        : undefined,
                    });
                    setSelected(null);
                  }}
                >
                  Delete layer
                </button>
              </div>
            </>
          ) : (
            <p>Select a layer on the canvas or add a new one.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
