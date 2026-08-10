'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-right text-sm">
        <p className="font-medium text-slate-900 dark:text-slate-100">{user?.email}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{user?.roles.join(', ') || 'No roles'}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={handleLogout}>
        Sign out
      </Button>
    </header>
  );
}
