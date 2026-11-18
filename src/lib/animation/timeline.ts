import { z } from "zod";
// Numeric-only keyframes: no arbitrary CSS, URLs, selectors or executable code.
export const motionFrameSchema = z
  .object({
    offset: z.number().min(0).max(1),
    opacity: z.number().min(0).max(1).optional(),
    x: z.number().min(-2400).max(2400).optional(),
    y: z.number().min(-3200).max(3200).optional(),
    rotation: z.number().min(-360).max(360).optional(),
    scale: z.number().min(0.05).max(4).optional(),
  })
  .strict();
export const easings = [
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "cubic-bezier(0.22, 1, 0.36, 1)",
] as const;
export const trackSchema = z
  .object({
    layerId: z.string().uuid(),
    start: z.number().int().min(0).max(25000),
    duration: z.number().int().min(100).max(15000),
    easing: z.enum(easings),
    frames: z.array(motionFrameSchema).min(2).max(12),
  })
  .strict()
  .superRefine((t, c) => {
    if (
      t.frames[0].offset !== 0 ||
      t.frames.at(-1)!.offset !== 1 ||
      t.frames.some((f, i) => i > 0 && f.offset <= t.frames[i - 1].offset)
    )
      c.addIssue({
        code: "custom",
        message: "Keyframes must increase from 0 to 1",
      });
  });
export const timelineSchema = z
  .object({
    version: z.literal(1),
    duration: z.number().int().min(100).max(30000),
    tracks: z.array(trackSchema).max(80),
  })
  .strict()
  .superRefine((t, c) => {
    const targets = new Set<string>();
    for (const track of t.tracks) {
      if (track.start + track.duration > t.duration)
        c.addIssue({
          code: "custom",
          message: "Track exceeds timeline duration",
        });
      if (targets.has(track.layerId))
        c.addIssue({
          code: "custom",
          message: "Use one keyframe track per layer",
        });
      targets.add(track.layerId);
    }
  });
export type Timeline = z.infer<typeof timelineSchema>;
export type MotionTrack = z.infer<typeof trackSchema>;
export const presets = [
  "fade",
  "rise",
  "slide-left",
  "slide-right",
  "zoom",
  "turn",
  "door-left",
  "door-right",
  "petal",
] as const;
export type MotionPreset = (typeof presets)[number];
export function presetFrames(preset: MotionPreset): MotionTrack["frames"] {
  const end = { offset: 1, opacity: 1, x: 0, y: 0, rotation: 0, scale: 1 };
  switch (preset) {
    case "rise":
      return [{ ...end, offset: 0, opacity: 0, y: 90 }, end];
    case "slide-left":
      return [{ ...end, offset: 0, opacity: 0, x: -180 }, end];
    case "slide-right":
      return [{ ...end, offset: 0, opacity: 0, x: 180 }, end];
    case "zoom":
      return [{ ...end, offset: 0, opacity: 0, scale: 0.6 }, end];
    case "turn":
      return [
        { ...end, offset: 0, opacity: 0, rotation: -25, scale: 0.7 },
        end,
      ];
    case "door-left":
      return [
        { ...end, offset: 0 },
        { ...end, x: -650, opacity: 0 },
      ];
    case "door-right":
      return [
        { ...end, offset: 0 },
        { ...end, x: 650, opacity: 0 },
      ];
    case "petal":
      return [
        { ...end, offset: 0, y: -140, rotation: -40, opacity: 0 },
        { ...end, offset: 0.4, y: 0, rotation: 0 },
        { ...end, y: 120, rotation: 60, opacity: 0 },
      ];
    default:
      return [{ ...end, offset: 0, opacity: 0 }, end];
  }
}
export function keyframes(track: MotionTrack, scale: number): Keyframe[] {
  return track.frames.map((f) => ({
    offset: f.offset,
    ...(f.opacity === undefined ? {} : { opacity: f.opacity }),
    translate: `${(f.x || 0) * scale}px ${(f.y || 0) * scale}px`,
    rotate: `${f.rotation || 0}deg`,
    scale: String(f.scale ?? 1),
  }));
}
