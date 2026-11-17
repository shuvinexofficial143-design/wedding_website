"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import type { CardDocument } from "@/lib/studio/schema";
import { fitText, layerText, type TextLayout } from "@/lib/studio/layout";
export function LayerCard({
  document: doc,
  values = {},
  fields,
  width,
  onIssues,
}: {
  document: CardDocument;
  values?: Record<string, string>;
  fields?: Record<string, string>;
  width?: number;
  onIssues?: (issues: string[]) => void;
}) {
  const [layouts, setLayouts] = useState<Record<string, TextLayout>>({});
  const [fontError, setFontError] = useState("");
  const [retry, setRetry] = useState(0);
  const signature = JSON.stringify({ doc, values, fields });
  useEffect(() => {
    let active = true;
    async function layout() {
      try {
        const canvas = window.document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is unavailable");
        const next: Record<string, TextLayout> = {};
        for (const l of doc.layers.filter(
          (l) => l.kind === "text" && !l.hidden,
        )) {
          const text = layerText(l, values, fields);
          const family = /[\u0900-\u097f]/.test(text)
            ? "Noto Serif Devanagari Variable"
            : l.fontFamily;
          await Promise.race([
            window.document.fonts.load(
              `${l.fontWeight} 16px "${family}"`,
              text || "Wedding",
            ),
            new Promise((_, reject) =>
              setTimeout(
                () => reject(new Error("Font loading timed out")),
                12000,
              ),
            ),
          ]);
          if (
            !window.document.fonts.check(
              `${l.fontWeight} 16px "${family}"`,
              text || "Wedding",
            )
          )
            throw new Error("Required font has not loaded");
          next[l.id] = fitText(l, text, (s, size, font) => {
            ctx.font = `${l.fontWeight} ${size}px "${font}"`;
            return ctx.measureText(s).width;
          });
        }
        if (active) {
          setLayouts(next);
          setFontError("");
          onIssues?.(
            doc.layers
              .filter((l) => next[l.id]?.overflow)
              .map(
                (l) =>
                  `${l.label}: text does not fit; shorten it or resize its layer.`,
              ),
          );
        }
      } catch (e) {
        if (active) {
          setFontError((e as Error).message);
          onIssues?.([(e as Error).message]);
        }
      }
    }
    void layout();
    return () => {
      active = false;
    };
    // The stable serialized document covers every typography and input change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, retry]);
  const textReady = doc.layers
    .filter((l) => l.kind === "text" && !l.hidden)
    .every((l) => layouts[l.id]);
  return (
    <div
      className="layer-card"
      data-export-ready={textReady && !fontError ? "true" : "false"}
      data-overflow={
        Object.values(layouts).some((l) => l.overflow) ? "true" : "false"
      }
      style={{
        position: "relative",
        width: width || "100%",
        aspectRatio: `${doc.width}/${doc.height}`,
        background: doc.backgroundColor,
        overflow: "hidden",
        containerType: "inline-size",
      }}
    >
      {doc.backgroundAssetId && (
        <img
          key={`${doc.backgroundAssetId}-${retry}`}
          src={`/api/assets/${doc.backgroundAssetId}`}
          alt="Invitation background"
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "fill",
          }}
        />
      )}
      {[...doc.layers]
        .sort((a, b) => a.zIndex - b.zIndex)
        .filter((l) => !l.hidden)
        .map((l) => {
          const layout = layouts[l.id];
          const text = layerText(l, values, fields);
          const style = {
            position: "absolute" as const,
            left: `${(l.x / doc.width) * 100}%`,
            top: `${(l.y / doc.height) * 100}%`,
            width: `${(l.width / doc.width) * 100}%`,
            height: `${(l.height / doc.height) * 100}%`,
            transform: `rotate(${l.rotation}deg)`,
            opacity: l.opacity,
            zIndex: l.zIndex,
            overflow: "hidden",
          };
          return (
            <div key={l.id} data-layer={l.id} style={style}>
              {l.kind === "text" ? (
                <div
                  style={{
                    fontFamily: layout?.fontFamily || l.fontFamily,
                    fontSize: `${((layout?.fontSize || l.fontSize) / doc.width) * 100}cqw`,
                    fontWeight: l.fontWeight,
                    lineHeight: l.lineHeight,
                    color: l.color,
                    textAlign: l.align,
                    letterSpacing: `${(l.letterSpacing / doc.width) * 100}cqw`,
                    whiteSpace: "pre",
                  }}
                >
                  {(layout?.lines || [text]).map((line, i) => (
                    <div key={i}>{line || "\u00a0"}</div>
                  ))}
                </div>
              ) : l.kind === "shape" ? (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: l.fill,
                    border: `${(l.borderWidth / doc.width) * 100}cqw solid ${l.borderColor}`,
                    borderRadius: l.shape === "ellipse" ? "50%" : 0,
                  }}
                />
              ) : (
                (values[l.id] || l.assetId) && (
                  <img
                    key={retry}
                    src={values[l.id] || `/api/assets/${l.assetId}`}
                    alt={l.label}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )
              )}
            </div>
          );
        })}
      {fontError && (
        <div className="layer-error" data-export-ignore="true" role="alert">
          {fontError}
          <button onClick={() => setRetry((n) => n + 1)}>
            Retry fonts/assets
          </button>
        </div>
      )}
    </div>
  );
}
