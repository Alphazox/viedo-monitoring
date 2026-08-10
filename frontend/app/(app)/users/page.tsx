'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, Thead, Tbody, Td } from '@/components/ui/table';
import { PageSpinner, EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { rolesApi, usersApi } from '@/lib/api/resources';
import type { Role, UserAccount } from '@/lib/api/types';
import { UserFormModal } from './user-form-modal';

export default function UsersPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAccount[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<{ user?: UserAccount } | null>(null);
  const limit = 20;

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await usersApi.list({ page, limit });
      setUsers(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users.');
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    load();
  }, [load]);

  useEffect(() => {
    rolesApi.list().then(setRoles).catch(() => setRoles([]));
  }, []);

  async function handleDeactivate(u: UserAccount) {
    if (!window.confirm(`Deactivate ${u.email}? They will no longer be able to sign in.`)) return;
    try {
      await usersApi.deactivate(u.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to deactivate user.');
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <PageHeader
        title="Users"
        description="Users are scoped to your organization. Deleting a user deactivates their account rather than removing it."
        actions={hasPermission('users:create') && <Button onClick={() => setFormTarget({})}>Add user</Button>}
      />

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {users === null ? (
        <PageSpinner />
      ) : users.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <>
          <Table>
            <Thead columns={['Name', 'Email', 'Roles', 'Status', 'Last login', 'Actions']} />
            <Tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">
                    {u.firstName} {u.lastName}
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.length === 0 ? '—' : u.roles.map((r) => <Badge key={r.id} tone="indigo">{r.name}</Badge>)}
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={u.isActive ? 'green' : 'gray'}>{u.isActive ? 'Active' : 'Deactivated'}</Badge>
                  </Td>
                  <Td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}</Td>
                  <Td>
                    <div className="flex gap-2">
                      {hasPermission('users:update') && (
                        <Button size="sm" variant="secondary" onClick={() => setFormTarget({ user: u })}>
                          Edit
                        </Button>
                      )}
                      {hasPermission('users:delete') && u.isActive && u.id !== currentUser?.sub && (
                        <Button size="sm" variant="danger" onClick={() => handleDeactivate(u)}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </Tbody>
          </Table>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{total} user{total === 1 ? '' : 's'}</span>
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
        <UserFormModal
          user={formTarget.user}
          roles={roles}
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
