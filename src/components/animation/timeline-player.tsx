"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { keyframes, type Timeline } from "@/lib/animation/timeline";
/** One clock drives all tracks, so sequential and parallel tracks stay aligned. */
export function TimelinePlayer({
  timeline,
  width,
  children,
}: {
  timeline: Timeline;
  width: number;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null),
    animations = useRef<Animation[]>([]);
  const [state, setState] = useState("Loading artwork");
  const [reduced, setReduced] = useState(false);
  const signature = JSON.stringify(timeline);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let started = false;
    const cancel = () => {
      animations.current.forEach((a) => a.cancel());
      animations.current = [];
    };
    const start = () => {
      if (disposed || !element.querySelector('[data-export-ready="true"]'))
        return;
      started = true;
      cancel();
      setReduced(media.matches);
      if (!Element.prototype.animate) {
        setState("Motion reduced");
        return;
      }
      const scale = element.getBoundingClientRect().width / width;
      const now = document.timeline.currentTime;
      for (const track of timeline.tracks) {
        const layer = element.querySelector<HTMLElement>(
          `[data-layer="${track.layerId}"]`,
        );
        if (!layer) continue;
        const a = layer.animate(keyframes(track, scale), {
          duration: track.duration,
          delay: track.start,
          easing: track.easing,
          fill: "both",
        });
        a.startTime = now;
        if (media.matches) a.finish();
        animations.current.push(a);
      }
      setState(media.matches ? "Motion reduced" : "Playing");
      Promise.all(
        animations.current.map((a) => a.finished.catch(() => {})),
      ).then(() => {
        if (
          !disposed &&
          !media.matches &&
          animations.current.every((a) => a.playState === "finished")
        )
          setState("Finished");
      });
    };
    const changed = () => start();
    media.addEventListener("change", changed);
    const observer = new MutationObserver(() => {
      if (!started) start();
    });
    observer.observe(element, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-export-ready"],
    });
    start();
    return () => {
      disposed = true;
      observer?.disconnect();
      media.removeEventListener("change", changed);
      cancel();
    };
    // Timeline snapshot is versioned and serializable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, width]);
  function control(action: "play" | "pause" | "restart") {
    for (const a of animations.current) {
      if (action === "pause") a.pause();
      else {
        if (action === "restart" || a.playState === "finished")
          Reflect.set(a, "currentTime", 0);
        a.play();
      }
    }
    setState(action === "pause" ? "Paused" : "Playing");
  }
  return (
    <div className="motion-player" data-motion-state={state}>
      <div ref={root}>{children}</div>
      <div
        className="motion-controls"
        data-export-ignore="true"
        aria-label="Invitation animation controls"
      >
        <button
          type="button"
          disabled={reduced || state === "Loading artwork"}
          onClick={() => control(state === "Playing" ? "pause" : "play")}
        >
          {state === "Playing" ? "Pause animation" : "Play animation"}
        </button>
        <button
          type="button"
          disabled={reduced || state === "Loading artwork"}
          onClick={() => control("restart")}
        >
          Replay animation
        </button>
        <span role="status">{state}</span>
      </div>
    </div>
  );
}
