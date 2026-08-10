'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/input';
import { PageSpinner, ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { organizationsApi } from '@/lib/api/resources';
import type { Organization } from '@/lib/api/types';

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    organizationsApi
      .getMine()
      .then((data) => {
        setOrg(data);
        setName(data.name);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load organization.'));
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);
    try {
      const updated = await organizationsApi.updateMine({ name });
      setOrg(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update organization.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!org && !error) return <PageSpinner />;

  return (
    <div>
      <PageHeader title="Organization" description="Settings for your organization." />

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {org && (
        <div className="max-w-md rounded-lg bg-white p-6 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name">
              <Input
                required
                value={name}
                disabled={!hasPermission('organizations:update')}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Slug">
              <Input value={org.slug} disabled />
            </Field>
            {success && <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>}
            {hasPermission('organizations:update') && (
              <Button type="submit" isLoading={isSubmitting}>
                Save changes
              </Button>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
