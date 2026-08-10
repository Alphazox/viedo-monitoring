'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Label } from '@/components/ui/input';
import { ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { rolesApi } from '@/lib/api/resources';
import type { PermissionDefinition, Role } from '@/lib/api/types';

function groupByResource(permissions: PermissionDefinition[]): Record<string, PermissionDefinition[]> {
  const groups: Record<string, PermissionDefinition[]> = {};
  for (const perm of permissions) {
    const [resource] = perm.key.split(':');
    (groups[resource] ??= []).push(perm);
  }
  return groups;
}

export function RoleFormModal({
  role,
  permissions,
  onClose,
  onSaved,
}: {
  role?: Role;
  permissions: PermissionDefinition[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(role);
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(role?.permissions.map((p) => p.permission.key) ?? []),
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groups = useMemo(() => groupByResource(permissions), [permissions]);

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const permissionKeys = [...selected];
      if (isEdit && role) {
        await rolesApi.update(role.id, { name, description: description || undefined });
        await rolesApi.assignPermissions(role.id, permissionKeys);
      } else {
        await rolesApi.create({ name, description: description || undefined, permissionKeys });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save role.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${role?.name}` : 'Add role'} onClose={onClose} widthClassName="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorNotice message={error} />}

        {role?.isSystem && (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            This is a system role.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <Input required value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>

        <div>
          <Label>Permissions</Label>
          <div className="max-h-72 space-y-3 overflow-y-auto rounded-md border border-slate-200 p-3 dark:border-slate-700">
            {Object.entries(groups).map(([resource, perms]) => (
              <div key={resource}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{resource}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {perms.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
                      <input
                        type="checkbox"
                        checked={selected.has(perm.key)}
                        onChange={() => toggle(perm.key)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span title={perm.description}>{perm.key}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add role'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
