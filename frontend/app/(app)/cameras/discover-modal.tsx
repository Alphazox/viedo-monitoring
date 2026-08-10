'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Spinner, ErrorNotice, EmptyState } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { camerasApi } from '@/lib/api/resources';
import type { DiscoveredDevice } from '@/lib/api/types';

export function DiscoverModal({
  onClose,
  onUseDevice,
}: {
  onClose: () => void;
  onUseDevice: (device: DiscoveredDevice) => void;
}) {
  const [devices, setDevices] = useState<DiscoveredDevice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    camerasApi
      .discover()
      .then((result) => {
        if (!cancelled) setDevices(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Discovery failed.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Modal title="ONVIF network discovery" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        Sweeping the API host&apos;s local network via WS-Discovery (~5s). This depends on UDP multicast
        reaching the API container — it may not find devices across a Docker bridge network without host
        networking. See the Phase 4 LLD §5 risk flag.
      </p>

      {devices === null && !error && (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
          <Spinner /> Scanning…
        </div>
      )}

      {error && <ErrorNotice message={error} />}

      {devices && devices.length === 0 && (
        <EmptyState
          title="No devices found"
          description="No ONVIF device responded to the discovery probe. You can still add an ONVIF/RTSP camera manually with its known address."
        />
      )}

      {devices && devices.length > 0 && (
        <ul className="divide-y divide-slate-200 dark:divide-slate-800">
          {devices.map((device) => (
            <li key={device.address} className="flex items-center justify-between py-2.5">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{device.address}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {device.manufacturer ?? 'Unknown manufacturer'} {device.model ?? ''}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => onUseDevice(device)}>
                Use this address
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end pt-4">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
