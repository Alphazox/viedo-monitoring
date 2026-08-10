'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Table, Thead, Tbody, Td } from '@/components/ui/table';
import { PageSpinner, EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { camerasApi, recordingsApi } from '@/lib/api/resources';
import type { Camera, Recording } from '@/lib/api/types';
import { UploadModal } from './upload-modal';
import { PlayerModal } from './player-modal';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export default function RecordingsPage() {
  const { hasPermission } = useAuth();
  const [recordings, setRecordings] = useState<Recording[] | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [playing, setPlaying] = useState<Recording | null>(null);

  const limit = 20;

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await recordingsApi.list({ page, limit });
      setRecordings(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load recordings.');
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    load();
  }, [load]);

  useEffect(() => {
    camerasApi.list({ limit: 100 }).then((result) => setCameras(result.items)).catch(() => setCameras([]));
  }, []);

  async function handleDelete(recording: Recording) {
    if (!window.confirm(`Delete recording "${recording.title}"? This cannot be undone.`)) return;
    try {
      await recordingsApi.remove(recording.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete recording.');
    }
  }

  const cameraName = (cameraId: string | null) => cameras.find((c) => c.id === cameraId)?.name ?? '—';
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <PageHeader
        title="Recordings"
        description="Upload existing CCTV footage to store and play it back — separate from the automated recording engine (later phase)."
        actions={
          hasPermission('recordings:create') && <Button onClick={() => setShowUpload(true)}>Upload recording</Button>
        }
      />

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {recordings === null ? (
        <PageSpinner />
      ) : recordings.length === 0 ? (
        <EmptyState title="No recordings yet" description="Upload a video file to store and play it back here." />
      ) : (
        <>
          <Table>
            <Thead columns={['Title', 'Camera', 'Size', 'Uploaded', 'Actions']} />
            <Tbody>
              {recordings.map((recording) => (
                <tr key={recording.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{recording.title}</Td>
                  <Td>{cameraName(recording.cameraId)}</Td>
                  <Td>{formatBytes(recording.sizeBytes)}</Td>
                  <Td>{new Date(recording.createdAt).toLocaleString()}</Td>
                  <Td>
                    <div className="flex gap-2">
                      {hasPermission('recordings:read') && (
                        <Button size="sm" variant="secondary" onClick={() => setPlaying(recording)}>
                          Play
                        </Button>
                      )}
                      {hasPermission('recordings:delete') && (
                        <Button size="sm" variant="danger" onClick={() => handleDelete(recording)}>
                          Delete
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{total} recording{total === 1 ? '' : 's'}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span>Page {page} of {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {showUpload && (
        <UploadModal
          cameras={cameras}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            load();
          }}
        />
      )}

      {playing && <PlayerModal recording={playing} onClose={() => setPlaying(null)} />}
    </div>
  );
}
