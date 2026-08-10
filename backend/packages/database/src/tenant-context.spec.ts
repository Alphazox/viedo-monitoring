import { TenantContext } from './tenant-context';

describe('TenantContext', () => {
  it('returns undefined outside of a run() call', () => {
    expect(TenantContext.getOrganizationId()).toBeUndefined();
  });

  it('exposes the organizationId for the duration of run()', () => {
    TenantContext.run('org-1', () => {
      expect(TenantContext.getOrganizationId()).toBe('org-1');
    });

    expect(TenantContext.getOrganizationId()).toBeUndefined();
  });

  it('isolates nested contexts by async call stack', async () => {
    const results: string[] = [];

    await Promise.all([
      TenantContext.run('org-a', async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(TenantContext.getOrganizationId()!);
      }),
      TenantContext.run('org-b', async () => {
        results.push(TenantContext.getOrganizationId()!);
      }),
    ]);

    expect(results.sort()).toEqual(['org-a', 'org-b']);
  });

  it('requireOrganizationId throws outside of a run() call', () => {
    expect(() => TenantContext.requireOrganizationId()).toThrow(
      'Tenant context is not set for this operation',
    );
  });

  it('requireOrganizationId returns the value inside a run() call', () => {
    TenantContext.run('org-1', () => {
      expect(TenantContext.requireOrganizationId()).toBe('org-1');
    });
  });
});
