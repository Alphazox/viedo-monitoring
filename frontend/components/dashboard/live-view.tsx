"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

const VIDEO_ENGINE_BASE_URL = process.env.NEXT_PUBLIC_VIDEO_ENGINE_URL ?? "http://localhost:8002";

interface LiveViewProps {
  cameraId: string;
}

export function LiveView({ cameraId }: LiveViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = `${VIDEO_ENGINE_BASE_URL}/live/${cameraId}/index.m3u8`;
    setError(null);

    if (Hls.isSupported()) {
      const hls = new Hls({ maxLiveSyncPlaybackRate: 1.5 });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Live stream unavailable for this camera.");
        }
      });
      return () => hls.destroy();
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    setError("This browser can't play live video streams.");
    return undefined;
  }, [cameraId]);

  if (error) {
    return <div className="dash-empty">{error}</div>;
  }

  return <video ref={videoRef} autoPlay muted playsInline controls style={{ width: "100%", borderRadius: 8 }} />;
}
