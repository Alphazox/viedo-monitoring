'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { camerasApi } from '@/lib/api/resources';
import type { Camera, CameraSourceType, RecordingMode, Zone } from '@/lib/api/types';

const SOURCE_TYPES: CameraSourceType[] = ['RTSP', 'ONVIF', 'USB', 'FILE'];
const RECORDING_MODES: RecordingMode[] = ['CONTINUOUS', 'EVENT_ONLY', 'OFF'];

export function CameraFormModal({
  camera,
  zones,
  prefill,
  onClose,
  onSaved,
}: {
  camera?: Camera;
  zones: Zone[];
  prefill?: { rtspUrl?: string; sourceType?: CameraSourceType };
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(camera);
  const [name, setName] = useState(camera?.name ?? '');
  const [sourceType, setSourceType] = useState<CameraSourceType>(
    camera?.sourceType ?? prefill?.sourceType ?? 'RTSP',
  );
  const [zoneId, setZoneId] = useState(camera?.zoneId ?? '');
  const [rtspUrl, setRtspUrl] = useState(camera?.rtspUrl ?? prefill?.rtspUrl ?? '');
  const [rtspUsername, setRtspUsername] = useState(camera?.rtspUsername ?? '');
  const [rtspPassword, setRtspPassword] = useState('');
  const [usbDevicePath, setUsbDevicePath] = useState(camera?.usbDevicePath ?? '');
  const [fileSourceUri, setFileSourceUri] = useState(camera?.fileSourceUri ?? '');
  const [recordingMode, setRecordingMode] = useState<RecordingMode>(camera?.recordingMode ?? 'EVENT_ONLY');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const needsRtsp = sourceType === 'RTSP' || sourceType === 'ONVIF';

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name,
        sourceType,
        zoneId: zoneId || undefined,
        rtspUrl: needsRtsp ? rtspUrl : undefined,
        rtspUsername: needsRtsp && rtspUsername ? rtspUsername : undefined,
        rtspPassword: needsRtsp && rtspPassword ? rtspPassword : undefined,
        usbDevicePath: sourceType === 'USB' ? usbDevicePath : undefined,
        fileSourceUri: sourceType === 'FILE' ? fileSourceUri : undefined,
        recordingMode,
      };

      if (isEdit && camera) {
        await camerasApi.update(camera.id, {
          ...payload,
          zoneId: zoneId || null,
        });
      } else {
        await camerasApi.create(payload);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save camera.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${camera?.name}` : 'Add camera'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorNotice message={error} />}

        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Source type">
          <Select value={sourceType} onChange={(e) => setSourceType(e.target.value as CameraSourceType)}>
            {SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Zone" hint="Optional — leave unassigned pending setup.">
          <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
            <option value="">Unassigned</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </Select>
        </Field>

        {needsRtsp && (
          <>
            <Field
              label="Stream URL"
              hint="rtsp://host:554/stream, optionally with credentials embedded (rtsp://user:pass@host/...)."
            >
              <Input
                required
                value={rtspUrl}
                onChange={(e) => setRtspUrl(e.target.value)}
                placeholder="rtsp://192.168.1.50:554/stream1"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Username" hint="Optional if embedded in the URL.">
                <Input value={rtspUsername} onChange={(e) => setRtspUsername(e.target.value)} />
              </Field>
              <Field
                label="Password"
                hint={isEdit ? 'Leave blank to keep the stored password.' : 'Optional if embedded in the URL.'}
              >
                <Input
                  type="password"
                  value={rtspPassword}
                  onChange={(e) => setRtspPassword(e.target.value)}
                />
              </Field>
            </div>
          </>
        )}

        {sourceType === 'USB' && (
          <Field label="USB device path">
            <Input value={usbDevicePath} onChange={(e) => setUsbDevicePath(e.target.value)} placeholder="/dev/video0" />
          </Field>
        )}

        {sourceType === 'FILE' && (
          <Field label="File source URI" hint="Modeled only — no upload/storage backend exists yet.">
            <Input value={fileSourceUri} onChange={(e) => setFileSourceUri(e.target.value)} />
          </Field>
        )}

        <Field label="Recording mode">
          <Select value={recordingMode} onChange={(e) => setRecordingMode(e.target.value as RecordingMode)}>
            {RECORDING_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add camera'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
