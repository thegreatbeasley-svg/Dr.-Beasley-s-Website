"use client";

import React from "react";
import type { VideoEmbed } from "@/lib/books/video";

const FRAME =
  "relative aspect-video w-full overflow-hidden rounded-[3px] bg-black ring-1 ring-white/10 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.85)]";

/**
 * A book's promotional video in a responsive 16:9 frame. Never autoplays on
 * page load.
 *  - Uploaded MP4: a native <video> with standard controls; only its
 *    metadata (first frame) is requested up front, from our own storage.
 *  - YouTube / Vimeo: a click-to-play panel. The provider's player (and its
 *    scripts/cookies) is only requested after the visitor presses play, so
 *    no third-party request is made merely by viewing the page.
 */
export default function VideoPlayer({ video, title }: { video: VideoEmbed; title: string }) {
  const [playing, setPlaying] = React.useState(false);

  if (video.kind === "file") {
    return (
      <div className={FRAME}>
        <video
          controls
          playsInline
          preload="metadata"
          aria-label={`${title} — video`}
          className="absolute inset-0 h-full w-full object-contain"
        >
          <source src={video.src} type="video/mp4" />
          Your browser can&rsquo;t play this video.
        </video>
      </div>
    );
  }

  if (playing) {
    const src = `${video.embedUrl}${video.embedUrl.includes("?") ? "&" : "?"}autoplay=1`;
    return (
      <div className={FRAME}>
        <iframe
          src={src}
          title={`${title} — video on ${video.provider}`}
          loading="lazy"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    );
  }

  return (
    <div className={FRAME}>
      <button
        type="button"
        onClick={() => setPlaying(true)}
        aria-label={`Play video: ${title}`}
        className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-ink-elevated to-ink px-6 text-center transition-colors hover:from-ink-elevated hover:to-ink-elevated"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/60 text-gold transition-colors group-hover:border-gold group-hover:bg-gold/10 sm:h-20 sm:w-20">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8">
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        </span>
        <span className="font-display text-xl text-paper sm:text-2xl">Play video</span>
        <span className="max-w-xs text-xs leading-relaxed text-paper-muted">
          Plays from {video.provider}. Nothing is loaded from {video.provider} until you press play.
        </span>
      </button>
    </div>
  );
}
