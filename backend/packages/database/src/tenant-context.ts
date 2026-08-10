import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantStore {
  organizationId: string;
}

const storage = new AsyncLocalStorage<TenantStore>();

export const TenantContext = {
  run<T>(organizationId: string, fn: () => T): T {
    return storage.run({ organizationId }, fn);
  },

  getOrganizationId(): string | undefined {
    return storage.getStore()?.organizationId;
  },

  requireOrganizationId(): string {
    const organizationId = storage.getStore()?.organizationId;
    if (!organizationId) {
      throw new Error('Tenant context is not set for this operation');
    }
    return organizationId;
  },
};
