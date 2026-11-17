"use client";
import type { CardDocument } from "@/lib/studio/schema";
import {
  easings,
  presets,
  presetFrames,
  type MotionPreset,
} from "@/lib/animation/timeline";
export function TimelineEditor({
  document: doc,
  selected,
  onChange,
}: {
  document: CardDocument;
  selected: string | null;
  onChange: (doc: CardDocument) => void;
}) {
  const track = doc.animation?.tracks.find((t) => t.layerId === selected);
  const setTrack = (patch: Partial<NonNullable<typeof track>>) => {
    if (!selected) return;
    const tracks = [
      ...(doc.animation?.tracks || []).filter((t) => t.layerId !== selected),
      {
        layerId: selected,
        start: 0,
        duration: 1200,
        easing: "ease-out" as const,
        frames: presetFrames("rise"),
        ...track,
        ...patch,
      },
    ];
    onChange({
      ...doc,
      category: "animated",
      animation: {
        version: 1,
        duration: Math.max(100, ...tracks.map((t) => t.start + t.duration)),
        tracks,
      },
    });
  };
  return (
    <fieldset className="timeline-editor">
      <legend>Animation timeline</legend>
      <p>
        Times are milliseconds. Equal delays play together; later delays create
        a sequence. Saved with each immutable design version.
      </p>
      <label>
        <input
          type="checkbox"
          checked={!!doc.animation}
          onChange={(e) =>
            onChange({
              ...doc,
              category: e.target.checked ? "animated" : "cards",
              animation: e.target.checked
                ? { version: 1, duration: 6000, tracks: [] }
                : undefined,
            })
          }
        />
        Animated invitation
      </label>
      {doc.animation && (
        <>
          <p>Timeline duration: {doc.animation.duration} ms</p>
          {selected ? (
            <>
              <label>
                Animation type
                <select
                  aria-label="Animation type"
                  defaultValue=""
                  onChange={(e) =>
                    setTrack({
                      frames: presetFrames(e.target.value as MotionPreset),
                    })
                  }
                >
                  <option value="" disabled>
                    Choose a preset
                  </option>
                  {presets.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                Start delay (ms)
                <input
                  type="number"
                  min={0}
                  max={15000}
                  value={track?.start ?? 0}
                  onChange={(e) =>
                    setTrack({
                      start: Math.max(
                        0,
                        Math.min(15000, Math.round(+e.target.value)),
                      ),
                    })
                  }
                />
              </label>
              <label>
                Duration (ms)
                <input
                  type="number"
                  min={100}
                  max={15000}
                  value={track?.duration ?? 1200}
                  onChange={(e) =>
                    setTrack({
                      duration: Math.max(
                        100,
                        Math.min(15000, Math.round(+e.target.value)),
                      ),
                    })
                  }
                />
              </label>
              <label>
                Easing
                <select
                  value={track?.easing || "ease-out"}
                  onChange={(e) =>
                    setTrack({
                      easing: e.target.value as (typeof easings)[number],
                    })
                  }
                >
                  {easings.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </label>
              {track && (
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      ...doc,
                      animation: {
                        ...doc.animation!,
                        tracks: doc.animation!.tracks.filter(
                          (t) => t.layerId !== selected,
                        ),
                      },
                    })
                  }
                >
                  Remove layer animation
                </button>
              )}
            </>
          ) : (
            <p>Select a layer to edit its animation.</p>
          )}
          <ol>
            {doc.animation.tracks.map((t) => (
              <li key={t.layerId}>
                {doc.layers.find((l) => l.id === t.layerId)?.label}: {t.start}–
                {t.start + t.duration} ms
              </li>
            ))}
          </ol>
        </>
      )}
    </fieldset>
  );
}
