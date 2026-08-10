'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/input';
import { ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { cameraGroupsApi } from '@/lib/api/resources';
import type { CameraGroup } from '@/lib/api/types';

export function GroupFormModal({
  group,
  onClose,
  onSaved,
}: {
  group?: CameraGroup;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (group) {
        await cameraGroupsApi.update(group.id, { name, description: description || undefined });
      } else {
        await cameraGroupsApi.create({ name, description: description || undefined });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save group.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={group ? `Edit ${group.name}` : 'Add camera group'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorNotice message={error} />}
        <Field label="Name">
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Description">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {group ? 'Save changes' : 'Add group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
