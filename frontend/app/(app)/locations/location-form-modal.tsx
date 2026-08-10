'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { buildingsApi, floorsApi, sitesApi, zonesApi } from '@/lib/api/resources';
import type { Building, Floor, Site, Zone } from '@/lib/api/types';

type Target =
  | { level: 'site'; entity?: Site }
  | { level: 'building'; entity?: Building; siteId: string }
  | { level: 'floor'; entity?: Floor; buildingId: string }
  | { level: 'zone'; entity?: Zone; floorId: string };

const TITLES: Record<Target['level'], string> = {
  site: 'site',
  building: 'building',
  floor: 'floor',
  zone: 'zone',
};

export function LocationFormModal({ target, onClose, onSaved }: { target: Target; onClose: () => void; onSaved: () => void }) {
  const isEdit = Boolean(target.entity);
  const [name, setName] = useState(target.entity?.name ?? '');
  const [timezone, setTimezone] = useState(target.level === 'site' ? (target.entity as Site | undefined)?.timezone ?? 'UTC' : 'UTC');
  const [address, setAddress] = useState(target.level === 'site' ? (target.entity as Site | undefined)?.address ?? '' : '');
  const [level, setLevel] = useState(target.level === 'floor' ? (target.entity as Floor | undefined)?.level ?? 0 : 0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      switch (target.level) {
        case 'site':
          if (target.entity) await sitesApi.update(target.entity.id, { name, timezone, address: address || undefined });
          else await sitesApi.create({ name, timezone, address: address || undefined });
          break;
        case 'building':
          if (target.entity) await buildingsApi.update(target.entity.id, { name });
          else await buildingsApi.create({ siteId: target.siteId, name });
          break;
        case 'floor':
          if (target.entity) await floorsApi.update(target.entity.id, { name, level });
          else await floorsApi.create({ buildingId: target.buildingId, name, level });
          break;
        case 'zone':
          if (target.entity) await zonesApi.update(target.entity.id, { name });
          else await zonesApi.create({ floorId: target.floorId, name });
          break;
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to save ${TITLES[target.level]}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={`${isEdit ? 'Edit' : 'Add'} ${TITLES[target.level]}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorNotice message={error} />}
        <Field label="Name">
          <Input required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        {target.level === 'site' && (
          <>
            <Field label="Timezone">
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="UTC" />
            </Field>
            <Field label="Address">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} />
            </Field>
          </>
        )}
        {target.level === 'floor' && (
          <Field label="Level" hint="e.g. 0 for ground floor, negative for basements.">
            <Input type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export type { Target as LocationFormTarget };
