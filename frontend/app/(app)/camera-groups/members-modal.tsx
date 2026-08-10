'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Spinner, ErrorNotice, EmptyState } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { camerasApi, cameraGroupsApi } from '@/lib/api/resources';
import type { Camera, CameraGroup } from '@/lib/api/types';

const CANDIDATE_LIMIT = 200;

export function MembersModal({ group, onClose }: { group: CameraGroup; onClose: () => void }) {
  const [allCameras, setAllCameras] = useState<Camera[] | null>(null);
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [all, members] = await Promise.all([
        camerasApi.list({ limit: CANDIDATE_LIMIT }),
        camerasApi.list({ groupId: group.id, limit: CANDIDATE_LIMIT }),
      ]);
      setAllCameras(all.items);
      setMemberIds(new Set(members.items.map((c) => c.id)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load cameras.');
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id]);

  async function toggle(camera: Camera) {
    setPendingId(camera.id);
    setError(null);
    try {
      if (memberIds.has(camera.id)) {
        await cameraGroupsApi.removeCamera(group.id, camera.id);
        setMemberIds((prev) => {
          const next = new Set(prev);
          next.delete(camera.id);
          return next;
        });
      } else {
        await cameraGroupsApi.addCamera(group.id, camera.id);
        setMemberIds((prev) => new Set(prev).add(camera.id));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update membership.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Modal title={`Members of ${group.name}`} onClose={onClose}>
      {error && <div className="mb-3"><ErrorNotice message={error} /></div>}

      {allCameras === null ? (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Spinner /> Loading cameras…
        </div>
      ) : allCameras.length === 0 ? (
        <EmptyState title="No cameras yet" description="Add cameras first, then assign them to this group." />
      ) : (
        <ul className="max-h-80 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
          {allCameras.map((camera) => (
            <li key={camera.id} className="flex items-center justify-between py-2">
              <label className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={memberIds.has(camera.id)}
                  disabled={pendingId === camera.id}
                  onChange={() => toggle(camera)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                {camera.name}
              </label>
              {pendingId === camera.id && <Spinner className="h-3.5 w-3.5" />}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end pt-4">
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
