'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Field, Input, Label } from '@/components/ui/input';
import { ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { usersApi } from '@/lib/api/resources';
import type { Role, UserAccount } from '@/lib/api/types';

export function UserFormModal({
  user,
  roles,
  onClose,
  onSaved,
}: {
  user?: UserAccount;
  roles: Role[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(user);
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [roleIds, setRoleIds] = useState<Set<string>>(new Set(user?.roles.map((r) => r.id) ?? []));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleRole(id: string) {
    setRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEdit && user) {
        await usersApi.update(user.id, { firstName, lastName, roleIds: [...roleIds] });
      } else {
        await usersApi.create({ email, password, firstName, lastName, roleIds: [...roleIds] });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save user.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${user?.email}` : 'Add user'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorNotice message={error} />}

        <div className="grid grid-cols-2 gap-3">
          <Field label="First name">
            <Input required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input required value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
        </div>

        {!isEdit && (
          <>
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label="Password" hint="At least 8 characters, one uppercase, one lowercase, one number.">
              <Input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </>
        )}

        <div>
          <Label>Roles</Label>
          {roles.length === 0 ? (
            <p className="text-sm text-slate-500">No roles exist yet — create one on the Roles page first.</p>
          ) : (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-slate-200 p-2 dark:border-slate-700">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={roleIds.has(role.id)}
                    onChange={() => toggleRole(role.id)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  {role.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add user'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
