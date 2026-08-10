'use client';

import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Table, Thead, Tbody, Td } from '@/components/ui/table';
import { PageSpinner, EmptyState, ErrorNotice } from '@/components/ui/feedback';
import { ApiError } from '@/lib/api/client';
import { auditLogsApi } from '@/lib/api/resources';
import type { AuditLog } from '@/lib/api/types';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const limit = 30;

  const load = useCallback(async () => {
    setError(null);
    try {
      const result = await auditLogsApi.list({ page, limit });
      setLogs(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load audit log.');
    }
  }, [page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount, not a cascading-render bug
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <PageHeader title="Audit Log" description="Actions taken within your organization." />

      {error && <div className="mb-4"><ErrorNotice message={error} /></div>}

      {logs === null ? (
        <PageSpinner />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit events yet" />
      ) : (
        <>
          <Table>
            <Thead columns={['When', 'Action', 'Resource', 'IP Address']} />
            <Tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <Td>{new Date(log.createdAt).toLocaleString()}</Td>
                  <Td className="font-medium text-slate-900 dark:text-slate-100">{log.action}</Td>
                  <Td>
                    {log.resource}
                    {log.resourceId && <span className="text-slate-400"> · {log.resourceId.slice(0, 8)}</span>}
                  </Td>
                  <Td>{log.ipAddress ?? '—'}</Td>
                </tr>
              ))}
            </Tbody>
          </Table>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
            <span>{total} event{total === 1 ? '' : 's'}</span>
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
    </div>
  );
}
