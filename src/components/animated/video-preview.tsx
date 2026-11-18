"use client";
import { useEffect, useState } from "react";
import { youtubeEmbed } from "@/lib/animated/youtube";
export function AnimatedVideoPreview({
  videoId,
  title,
}: {
  videoId: string;
  title: string;
}) {
  const [loaded, setLoaded] = useState(false),
    [slow, setSlow] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 15000);
    return () => clearTimeout(timer);
  }, [attempt]);
  return (
    <div className="animated-video">
      <div className="video-player-frame">
        <iframe
          key={videoId + "-" + attempt}
          title={title + " sample YouTube invitation"}
          src={youtubeEmbed(videoId)}
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setLoaded(true)}
        />
        {!loaded && (
          <div className="video-loading" aria-live="polite">
            <span aria-hidden="true">❦</span>Loading your invitation preview…
          </div>
        )}
      </div>
      {slow && !loaded && (
        <div className="video-recovery">
          <span>Preview taking longer than expected.</span>
          <button
            onClick={() => {
              setSlow(false);
              setAttempt((n) => n + 1);
            }}
          >
            Retry
          </button>
        </div>
      )}
      <p>
        Sample video hosted on YouTube. The finished invitation is prepared
        individually.{" "}
        <a
          className="text-link"
          href={"https://www.youtube.com/watch?v=" + videoId}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open on YouTube ↗
        </a>
      </p>
    </div>
  );
}
