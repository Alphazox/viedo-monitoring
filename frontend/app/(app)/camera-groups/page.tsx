'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Table, Thead, Tbody, Td } from '@/components/ui/table';
import { PageSpinner, EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { cameraGroupsApi } from '@/lib/api/resources';
import type { CameraGroup } from '@/lib/api/types';
import { GroupFormModal } from './group-form-modal';
import { MembersModal } from './members-modal';

export default function CameraGroupsPage() {
  const { hasPermission } = useAuth();
  const [groups, setGroups] = useState<CameraGroup[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<{ group?: CameraGroup } | null>(null);
  const [membersTarget, setMembersTarget] = useState<CameraGroup | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setGroups(await cameraGroupsApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load camera groups.');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    load();
  }, [load]);

  async function handleDelete(group: CameraGroup) {
    if (!window.confirm(`Delete group "${group.name}"? This cannot be undone.`)) return;
    try {
      await cameraGroupsApi.remove(group.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete group.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Camera Groups"
        description="Organize cameras into groups for filtering and future bulk operations."
        actions={hasPermission('camera-groups:create') && <Button onClick={() => setFormTarget({})}>Add group</Button>}
      />

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {groups === null ? (
        <PageSpinner />
      ) : groups.length === 0 ? (
        <EmptyState title="No camera groups yet" description="Create a group to organize cameras, e.g. by building or use case." />
      ) : (
        <Table>
          <Thead columns={['Name', 'Description', 'Actions']} />
          <Tbody>
            {groups.map((group) => (
              <tr key={group.id}>
                <Td className="font-medium text-slate-900 dark:text-slate-100">{group.name}</Td>
                <Td>{group.description || '—'}</Td>
                <Td>
                  <div className="flex gap-2">
                    {hasPermission('camera-groups:update') && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => setMembersTarget(group)}>
                          Members
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setFormTarget({ group })}>
                          Edit
                        </Button>
                      </>
                    )}
                    {hasPermission('camera-groups:delete') && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(group)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      )}

      {formTarget && (
        <GroupFormModal
          group={formTarget.group}
          onClose={() => setFormTarget(null)}
          onSaved={() => {
            setFormTarget(null);
            load();
          }}
        />
      )}

      {membersTarget && <MembersModal group={membersTarget} onClose={() => setMembersTarget(null)} />}
    </div>
  );
}
