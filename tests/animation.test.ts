import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  timelineSchema,
  presetFrames,
  keyframes,
  presets,
} from "../src/lib/animation/timeline";
import {
  newDocument,
  documentSchema,
  layerSchema,
} from "../src/lib/studio/schema";
const id = randomUUID();
const track = {
  layerId: id,
  start: 200,
  duration: 1000,
  easing: "ease-out" as const,
  frames: presetFrames("rise"),
};
test("versioned timeline validates bounds, sequence, parallel tracks and numeric-only transforms", () => {
  assert.ok(
    timelineSchema.safeParse({
      version: 1,
      duration: 1200,
      tracks: [track, { ...track, layerId: randomUUID() }],
    }).success,
  );
  for (const invalid of [
    { version: 2, duration: 1200, tracks: [track] },
    { version: 1, duration: 1000, tracks: [track] },
    { version: 1, duration: 1200, tracks: [track, track] },
    {
      version: 1,
      duration: 1200,
      tracks: [{ ...track, frames: [{ offset: 1 }, { offset: 0 }] }],
    },
    {
      version: 1,
      duration: 1200,
      tracks: [{ ...track, easing: "url(javascript:alert(1))" }],
    },
  ])
    assert.equal(timelineSchema.safeParse(invalid).success, false);
  assert.equal(keyframes(track, 0.5)[0].translate, "0px 45px");
});
test("every preset has valid keyframes and document rejects dangling layer references", () => {
  for (const p of presets)
    assert.ok(
      timelineSchema.safeParse({
        version: 1,
        duration: 1200,
        tracks: [{ ...track, frames: presetFrames(p) }],
      }).success,
    );
  const doc = {
    ...newDocument(),
    category: "animated",
    animation: { version: 1, duration: 1200, tracks: [track] },
  };
  assert.equal(documentSchema.safeParse(doc).success, false);
  assert.ok(
    documentSchema.safeParse({
      ...doc,
      layers: [
        layerSchema.parse({
          id,
          kind: "text",
          label: "Bride",
          x: 100,
          y: 100,
          width: 600,
          height: 100,
        }),
      ],
    }).success,
  );
});
