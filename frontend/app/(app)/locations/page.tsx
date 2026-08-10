'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { PageSpinner, EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { buildingsApi, floorsApi, sitesApi, zonesApi } from '@/lib/api/resources';
import type { Building, Floor, Site, Zone } from '@/lib/api/types';
import { LocationFormModal, type LocationFormTarget } from './location-form-modal';

function ExpandRow({
  expanded,
  onToggle,
  depth,
  label,
  onAdd,
  onEdit,
  onDelete,
  addLabel,
  canAdd,
  canEdit,
  canDelete,
}: {
  expanded: boolean;
  onToggle: () => void;
  depth: number;
  label: string;
  onAdd?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  addLabel?: string;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0 dark:border-slate-800" style={{ paddingLeft: depth * 20 }}>
      <button onClick={onToggle} className="flex items-center gap-2 text-left text-sm font-medium text-slate-900 dark:text-slate-100">
        <span className="w-3 text-slate-400">{onAdd !== undefined ? (expanded ? '▾' : '▸') : ''}</span>
        {label}
      </button>
      <div className="flex gap-2">
        {canAdd && onAdd && (
          <Button size="sm" variant="secondary" onClick={onAdd}>
            {addLabel ?? 'Add'}
          </Button>
        )}
        {canEdit && onEdit && (
          <Button size="sm" variant="secondary" onClick={onEdit}>
            Edit
          </Button>
        )}
        {canDelete && onDelete && (
          <Button size="sm" variant="danger" onClick={onDelete}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const { hasPermission } = useAuth();
  const [sites, setSites] = useState<Site[] | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set());
  const [expandedBuildings, setExpandedBuildings] = useState<Set<string>>(new Set());
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [formTarget, setFormTarget] = useState<LocationFormTarget | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, b, f, z] = await Promise.all([sitesApi.list(), buildingsApi.list(), floorsApi.list(), zonesApi.list()]);
      setSites(s);
      setBuildings(b);
      setFloors(f);
      setZones(z);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load locations.');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    load();
  }, [load]);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  async function remove(kind: 'site' | 'building' | 'floor' | 'zone', id: string, name: string) {
    if (!window.confirm(`Delete ${kind} "${name}"? Everything nested underneath will also be removed.`)) return;
    try {
      if (kind === 'site') await sitesApi.remove(id);
      if (kind === 'building') await buildingsApi.remove(id);
      if (kind === 'floor') await floorsApi.remove(id);
      if (kind === 'zone') await zonesApi.remove(id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to delete ${kind}.`);
    }
  }

  const canCreate = hasPermission('sites:create') || hasPermission('buildings:create') || hasPermission('floors:create') || hasPermission('zones:create');

  return (
    <div>
      <PageHeader
        title="Locations"
        description="Site → Building → Floor → Zone hierarchy. Cameras are assigned to a Zone."
        actions={hasPermission('sites:create') && <Button onClick={() => setFormTarget({ level: 'site' })}>Add site</Button>}
      />

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {sites === null ? (
        <PageSpinner />
      ) : sites.length === 0 ? (
        <EmptyState title="No sites yet" description={canCreate ? 'Add a site to start building out your location hierarchy.' : 'No locations have been configured yet.'} />
      ) : (
        <div className="rounded-lg bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          {sites.map((site) => (
            <div key={site.id}>
              <ExpandRow
                depth={0}
                label={`${site.name} (${site.timezone})`}
                expanded={expandedSites.has(site.id)}
                onToggle={() => toggle(expandedSites, setExpandedSites, site.id)}
                onAdd={hasPermission('buildings:create') ? () => setFormTarget({ level: 'building', siteId: site.id }) : undefined}
                addLabel="Add building"
                canAdd
                onEdit={hasPermission('sites:update') ? () => setFormTarget({ level: 'site', entity: site }) : undefined}
                canEdit
                onDelete={hasPermission('sites:delete') ? () => remove('site', site.id, site.name) : undefined}
                canDelete
              />
              {expandedSites.has(site.id) &&
                buildings
                  .filter((b) => b.siteId === site.id)
                  .map((building) => (
                    <div key={building.id}>
                      <ExpandRow
                        depth={1}
                        label={building.name}
                        expanded={expandedBuildings.has(building.id)}
                        onToggle={() => toggle(expandedBuildings, setExpandedBuildings, building.id)}
                        onAdd={hasPermission('floors:create') ? () => setFormTarget({ level: 'floor', buildingId: building.id }) : undefined}
                        addLabel="Add floor"
                        canAdd
                        onEdit={hasPermission('buildings:update') ? () => setFormTarget({ level: 'building', entity: building, siteId: site.id }) : undefined}
                        canEdit
                        onDelete={hasPermission('buildings:delete') ? () => remove('building', building.id, building.name) : undefined}
                        canDelete
                      />
                      {expandedBuildings.has(building.id) &&
                        floors
                          .filter((f) => f.buildingId === building.id)
                          .map((floor) => (
                            <div key={floor.id}>
                              <ExpandRow
                                depth={2}
                                label={`${floor.name} (level ${floor.level})`}
                                expanded={expandedFloors.has(floor.id)}
                                onToggle={() => toggle(expandedFloors, setExpandedFloors, floor.id)}
                                onAdd={hasPermission('zones:create') ? () => setFormTarget({ level: 'zone', floorId: floor.id }) : undefined}
                                addLabel="Add zone"
                                canAdd
                                onEdit={hasPermission('floors:update') ? () => setFormTarget({ level: 'floor', entity: floor, buildingId: building.id }) : undefined}
                                canEdit
                                onDelete={hasPermission('floors:delete') ? () => remove('floor', floor.id, floor.name) : undefined}
                                canDelete
                              />
                              {expandedFloors.has(floor.id) &&
                                zones
                                  .filter((z) => z.floorId === floor.id)
                                  .map((zone) => (
                                    <ExpandRow
                                      key={zone.id}
                                      depth={3}
                                      label={zone.name}
                                      expanded={false}
                                      onToggle={() => {}}
                                      onEdit={hasPermission('zones:update') ? () => setFormTarget({ level: 'zone', entity: zone, floorId: floor.id }) : undefined}
                                      canEdit
                                      onDelete={hasPermission('zones:delete') ? () => remove('zone', zone.id, zone.name) : undefined}
                                      canDelete
                                    />
                                  ))}
                            </div>
                          ))}
                    </div>
                  ))}
            </div>
          ))}
        </div>
      )}

      {formTarget && (
        <LocationFormModal
          target={formTarget}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}
