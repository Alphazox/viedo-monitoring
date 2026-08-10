'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, Thead, Tbody, Td } from '@/components/ui/table';
import { PageSpinner, EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { permissionsApi, rolesApi } from '@/lib/api/resources';
import type { PermissionDefinition, Role } from '@/lib/api/types';
import { RoleFormModal } from './role-form-modal';

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [permissions, setPermissions] = useState<PermissionDefinition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<{ role?: Role } | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRoles(await rolesApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load roles.');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    load();
  }, [load]);

  useEffect(() => {
    permissionsApi.list().then(setPermissions).catch(() => setPermissions([]));
  }, []);

  async function handleDelete(role: Role) {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await rolesApi.remove(role.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete role.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Roles bundle permissions and are assigned to users."
        actions={hasPermission('roles:create') && <Button onClick={() => setFormTarget({})}>Add role</Button>}
      />

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {roles === null ? (
        <PageSpinner />
      ) : roles.length === 0 ? (
        <EmptyState title="No roles yet" />
      ) : (
        <Table>
          <Thead columns={['Name', 'Description', 'Permissions', 'Actions']} />
          <Tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <Td className="font-medium text-slate-900 dark:text-slate-100">
                  {role.name} {role.isSystem && <Badge tone="indigo">system</Badge>}
                </Td>
                <Td>{role.description || '—'}</Td>
                <Td>{role.permissions.length}</Td>
                <Td>
                  <div className="flex gap-2">
                    {hasPermission('roles:update') && (
                      <Button size="sm" variant="secondary" onClick={() => setFormTarget({ role })}>
                        Edit
                      </Button>
                    )}
                    {hasPermission('roles:delete') && !role.isSystem && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(role)}>
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
        <RoleFormModal
          role={formTarget.role}
          permissions={permissions}
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
