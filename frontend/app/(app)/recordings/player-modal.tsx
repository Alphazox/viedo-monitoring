'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { PageSpinner, ErrorNotice } from '@/components/ui/feedback';
import { ApiError, ensureFreshAccessToken } from '@/lib/api/client';
import { recordingsApi } from '@/lib/api/resources';
import type { Recording } from '@/lib/api/types';

export function PlayerModal({ recording, onClose }: { recording: Recording; onClose: () => void }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureFreshAccessToken()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Failed to prepare playback.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Modal title={recording.title} onClose={onClose} widthClassName="max-w-2xl">
      {error && <ErrorNotice message={error} />}
      {!error && !ready && <PageSpinner />}
      {!error && ready && (
        // eslint-disable-next-line jsx-a11y/media-has-caption -- uploaded recordings have no caption track
        <video className="w-full rounded-md bg-black" controls autoPlay src={recordingsApi.streamUrl(recording.id)} />
      )}
    </Modal>
  );
}
