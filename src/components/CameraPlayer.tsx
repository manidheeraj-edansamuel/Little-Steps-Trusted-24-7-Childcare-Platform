"use client";

import { useEffect, useRef, useState } from "react";

export type Camera = {
  id: string;
  name: string;
  location: string | null;
  streamUrl: string;
  type: "HLS" | "MP4" | "IFRAME";
  active: boolean;
};

export default function CameraPlayer({ camera }: { camera: Camera }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (camera.type === "IFRAME" || !camera.active) return;
    const video = videoRef.current;
    if (!video) return;

    let hls: import("hls.js").default | undefined;

    // A rejected play() is the browser's autoplay policy, not a dead camera —
    // the parent can still press the play control.
    const play = () => video.play().catch(() => undefined);

    const playNative = () => {
      video.src = camera.streamUrl;
      play();
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    };

    if (camera.type === "MP4") return playNative();

    // hls.js transmuxes for every browser; Safari's native HLS is the fallback.
    import("hls.js")
      .then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          playNative();
          return;
        }
        setFailed(false);
        hls = new Hls({ lowLatencyMode: true });
        hls.loadSource(camera.streamUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, play);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls?.recoverMediaError();
          else setFailed(true);
        });
      })
      .catch(() => playNative());

    return () => hls?.destroy();
  }, [camera.type, camera.streamUrl, camera.active]);

  const showOverlay = failed || !camera.active;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
      <div className="relative aspect-video">
        {camera.type === "IFRAME" ? (
          <iframe
            src={camera.streamUrl}
            title={camera.name}
            className="h-full w-full"
            allow="autoplay; fullscreen; encrypted-media"
            referrerPolicy="no-referrer"
          />
        ) : (
          <video
            ref={videoRef}
            controls
            muted
            playsInline
            onError={() => setFailed(true)}
            className="h-full w-full bg-black"
          />
        )}

        {showOverlay && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/90 px-4 text-center">
            <p className="text-sm font-medium text-white">
              {failed ? "Feed unavailable" : "Camera paused by provider"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {failed
                ? "The camera is offline or the stream URL is not reachable."
                : "The provider has stopped sharing this feed."}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{camera.name}</p>
          {camera.location && (
            <p className="truncate text-xs text-slate-400">{camera.location}</p>
          )}
        </div>
        {camera.active && !failed ? (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
            LIVE
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-medium text-slate-300">
            OFFLINE
          </span>
        )}
      </div>
    </div>
  );
}
