'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Select } from '@/components/ui/input';
import { ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { recordingsApi } from '@/lib/api/resources';
import type { Camera } from '@/lib/api/types';

export function UploadModal({
  cameras,
  onClose,
  onUploaded,
}: {
  cameras: Camera[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Choose a video file to upload.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    setProgress(0);
    try {
      await recordingsApi.upload(file, { title: title || undefined, cameraId: cameraId || undefined }, setProgress);
      onUploaded();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to upload recording.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Upload recording" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorNotice message={error} />}

        <Field label="Video file" hint="MP4, WebM, MOV, MKV, or AVI.">
          <Input
            type="file"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/x-msvideo,video/mpeg"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>

        <Field label="Title" hint="Optional — defaults to the file name.">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={file?.name} />
        </Field>

        <Field label="Camera" hint="Optional — associate this recording with a camera.">
          <Select value={cameraId} onChange={(e) => setCameraId(e.target.value)}>
            <option value="">Not associated</option>
            {cameras.map((camera) => (
              <option key={camera.id} value={camera.id}>
                {camera.name}
              </option>
            ))}
          </Select>
        </Field>

        {isSubmitting && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Upload
          </Button>
        </div>
      </form>
    </Modal>
  );
}
