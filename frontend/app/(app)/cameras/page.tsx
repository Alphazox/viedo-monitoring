'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { Table, Thead, Tbody, Td } from '@/components/ui/table';
import { PageSpinner, EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { camerasApi, zonesApi } from '@/lib/api/resources';
import type { Camera, CameraSourceType, CameraStatus, DiscoveredDevice, Zone } from '@/lib/api/types';
import { CameraFormModal } from './camera-form-modal';
import { DiscoverModal } from './discover-modal';
import { LiveViewModal } from './live-view-modal';

const STATUS_OPTIONS: CameraStatus[] = ['UNKNOWN', 'ONLINE', 'OFFLINE', 'DEGRADED'];
const SOURCE_OPTIONS: CameraSourceType[] = ['RTSP', 'ONVIF', 'USB', 'FILE'];

export default function CamerasPage() {
  const { hasPermission } = useAuth();
  const [cameras, setCameras] = useState<Camera[] | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const [formTarget, setFormTarget] = useState<{ camera?: Camera; prefill?: { rtspUrl?: string; sourceType?: CameraSourceType } } | null>(null);
  const [showDiscover, setShowDiscover] = useState(false);
  const [liveTarget, setLiveTarget] = useState<Camera | null>(null);

  const limit = 20;

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await camerasApi.list({
        page,
        limit,
        status: (statusFilter || undefined) as CameraStatus | undefined,
        sourceType: (sourceFilter || undefined) as CameraSourceType | undefined,
        zoneId: zoneFilter || undefined,
      });
      setCameras(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load cameras.');
    }
  }, [page, statusFilter, sourceFilter, zoneFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    load();
  }, [load]);

  useEffect(() => {
    zonesApi.list().then(setZones).catch(() => setZones([]));
  }, []);

  async function handleTestConnection(camera: Camera) {
    setCheckingId(camera.id);
    try {
      const updated = await camerasApi.testConnectionSaved(camera.id);
      setCameras((prev) => prev?.map((c) => (c.id === updated.id ? updated : c)) ?? prev);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Connection check failed.');
    } finally {
      setCheckingId(null);
    }
  }

  async function handleDelete(camera: Camera) {
    if (!window.confirm(`Delete camera "${camera.name}"? This cannot be undone.`)) return;
    try {
      await camerasApi.remove(camera.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete camera.');
    }
  }

  const zoneName = (zoneId: string | null) => zones.find((z) => z.id === zoneId)?.name ?? '—';
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <PageHeader
        title="Cameras"
        description="RTSP/ONVIF/USB/FILE camera sources — connectivity is checked on save and every 2 minutes."
        actions={
          hasPermission('cameras:create') && (
            <>
              {hasPermission('cameras:discover') && (
                <Button variant="secondary" onClick={() => setShowDiscover(true)}>
                  Discover (ONVIF)
                </Button>
              )}
              <Button onClick={() => setFormTarget({})}>Add camera</Button>
            </>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select className="w-40" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select className="w-40" value={sourceFilter} onChange={(e) => { setPage(1); setSourceFilter(e.target.value); }}>
          <option value="">All source types</option>
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select className="w-48" value={zoneFilter} onChange={(e) => { setPage(1); setZoneFilter(e.target.value); }}>
          <option value="">All zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </Select>
      </div>

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {cameras === null ? (
        <PageSpinner />
      ) : cameras.length === 0 ? (
        <EmptyState title="No cameras yet" description="Add a camera to start monitoring a feed — a video file, an RTSP/ONVIF stream, or a USB device." />
      ) : (
        <>
          <Table>
            <Thead columns={['Name', 'Source', 'Zone', 'Status', 'Last checked', 'Actions']} />
            <Tbody>
              {cameras.map((camera) => (
                <tr key={camera.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{camera.name}</Td>
                  <Td>{camera.sourceType}</Td>
                  <Td>{zoneName(camera.zoneId)}</Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <StatusBadge status={camera.status} />
                      {camera.lastError && (
                        <span className="max-w-xs truncate text-xs text-red-600 dark:text-red-400" title={camera.lastError}>
                          {camera.lastError}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>{camera.lastCheckedAt ? new Date(camera.lastCheckedAt).toLocaleString() : 'Never'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      {hasPermission('cameras:stream') && (camera.sourceType === 'RTSP' || camera.sourceType === 'ONVIF') && (
                        <Button size="sm" variant="secondary" onClick={() => setLiveTarget(camera)}>
                          Live
                        </Button>
                      )}
                      {hasPermission('cameras:test-connection') && (camera.sourceType === 'RTSP' || camera.sourceType === 'ONVIF') && (
                        <Button
                          size="sm"
                          variant="secondary"
                          isLoading={checkingId === camera.id}
                          onClick={() => handleTestConnection(camera)}
                        >
                          Test
                        </Button>
                      )}
                      {hasPermission('cameras:update') && (
                        <Button size="sm" variant="secondary" onClick={() => setFormTarget({ camera })}>
                          Edit
                        </Button>
                      )}
                      {hasPermission('cameras:delete') && (
                        <Button size="sm" variant="danger" onClick={() => handleDelete(camera)}>
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
            <span>{total} camera{total === 1 ? '' : 's'}</span>
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

      {formTarget && (
        <CameraFormModal
          camera={formTarget.camera}
          zones={zones}
          prefill={formTarget.prefill}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            load();
          }}
        />
      )}

      {showDiscover && (
        <DiscoverModal
          onClose={() => setShowDiscover(false)}
          onUseDevice={(device: DiscoveredDevice) => {
            setShowDiscover(false);
            setFormTarget({ prefill: { rtspUrl: `rtsp://${device.address}`, sourceType: 'ONVIF' } });
          }}
        />
      )}

      {liveTarget && <LiveViewModal camera={liveTarget} onClose={() => setLiveTarget(null)} />}
    </div>
  );
}
