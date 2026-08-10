'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ErrorNotice, Spinner } from '@/components/ui/feedback';
import { ensureFreshAccessToken } from '@/lib/api/client';
import { liveStreamApi } from '@/lib/api/resources';
import type { Camera } from '@/lib/api/types';

const POLL_INTERVAL_MS = 1500;
const READY_TIMEOUT_MS = 30000;

export function LiveViewModal({ camera, onClose }: { camera: Camera; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [status, setStatus] = useState<'starting' | 'ready' | 'error'>('starting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();

    async function attachPlayer() {
      const video = videoRef.current;
      if (!video) return;
      try {
        await ensureFreshAccessToken();
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError('Your session has expired — please sign in again.');
        }
        return;
      }
      if (cancelled) return;
      const url = liveStreamApi.playlistUrl(camera.id);
      if (Hls.isSupported()) {
        const hls = new Hls({ liveSyncDurationCount: 3 });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => undefined));
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play().catch(() => undefined);
      }
    }

    async function poll() {
      try {
        const result = await liveStreamApi.status(camera.id);
        if (cancelled) return;

        if (result.status === 'ready') {
          setStatus('ready');
          attachPlayer();
          return;
        }
        if (result.status === 'error') {
          setStatus('error');
          setError(result.error ?? 'Live preview failed to start.');
          return;
        }
        if (Date.now() - startedAt > READY_TIMEOUT_MS) {
          setStatus('error');
          setError('Timed out waiting for the live preview to start.');
          return;
        }
        pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError('Failed to check live preview status.');
        }
      }
    }

    liveStreamApi
      .start(camera.id)
      .then(() => {
        if (!cancelled) poll();
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('error');
          setError('Failed to start the live preview.');
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      hlsRef.current?.destroy();
      liveStreamApi.stop(camera.id).catch(() => undefined);
    };
  }, [camera.id]);

  return (
    <Modal title={`Live: ${camera.name}`} onClose={onClose} widthClassName="max-w-2xl">
      <div className="space-y-3">
        {status === 'starting' && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md bg-slate-100 py-16 dark:bg-slate-800">
            <Spinner className="h-8 w-8" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Connecting to the camera and starting the live preview…
            </p>
          </div>
        )}
        {status === 'error' && <ErrorNotice message={error ?? 'Live preview failed.'} />}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- live camera feed has no caption track */}
        <video
          ref={videoRef}
          className={`w-full rounded-md bg-black ${status === 'ready' ? '' : 'hidden'}`}
          controls
          muted
          playsInline
        />
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
