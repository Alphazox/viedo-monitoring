import { TenantContext } from './tenant-context';
import { TenantPrismaService } from './tenant-prisma.service';

type AllOperationsFn = (args: {
  model?: string;
  operation: string;
  args: Record<string, unknown>;
  query: (args: unknown) => Promise<unknown>;
}) => Promise<unknown>;

interface ExtensionConfig {
  query: { $allModels: { $allOperations: AllOperationsFn } };
}

function createExtension(): AllOperationsFn {
  let captured: ExtensionConfig | undefined;

  const fakePrisma = {
    $extends: (config: ExtensionConfig) => {
      captured = config;
      return config;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _service = new TenantPrismaService(fakePrisma);
  return captured!.query.$allModels.$allOperations;
}

describe('TenantPrismaService', () => {
  it('passes through queries for non-tenant-scoped models unchanged', async () => {
    const allOperations = createExtension();
    const query = jest.fn(async (args: unknown) => args);

    const result = await allOperations({
      model: 'Permission',
      operation: 'findMany',
      args: { where: { key: 'x' } },
      query,
    });

    expect(query).toHaveBeenCalledWith({ where: { key: 'x' } });
    expect(result).toEqual({ where: { key: 'x' } });
  });

  it('throws when no tenant context is set for a scoped model', async () => {
    const allOperations = createExtension();
    const query = jest.fn(async (args: unknown) => args);

    await expect(
      allOperations({ model: 'User', operation: 'findMany', args: {}, query }),
    ).rejects.toThrow('Tenant context is not set for this operation');
  });

  it('injects organizationId into create() data', async () => {
    const allOperations = createExtension();
    const query = jest.fn(async (args: unknown) => args);

    const result = (await TenantContext.run('org-1', () =>
      allOperations({
        model: 'User',
        operation: 'create',
        args: { data: { email: 'a@b.com' } },
        query,
      }),
    )) as { data: Record<string, unknown> };

    expect(result.data).toEqual({ email: 'a@b.com', organizationId: 'org-1' });
  });

  it('overwrites a client-supplied organizationId on create()', async () => {
    const allOperations = createExtension();
    const query = jest.fn(async (args: unknown) => args);

    const result = (await TenantContext.run('org-1', () =>
      allOperations({
        model: 'User',
        operation: 'create',
        args: { data: { email: 'a@b.com', organizationId: 'attacker-org' } },
        query,
      }),
    )) as { data: Record<string, unknown> };

    expect(result.data.organizationId).toBe('org-1');
  });

  it('merges organizationId into where for findMany', async () => {
    const allOperations = createExtension();
    const query = jest.fn(async (args: unknown) => args);

    const result = (await TenantContext.run('org-1', () =>
      allOperations({
        model: 'Site',
        operation: 'findMany',
        args: { where: { name: 'HQ' } },
        query,
      }),
    )) as { where: Record<string, unknown> };

    expect(result.where).toEqual({ name: 'HQ', organizationId: 'org-1' });
  });

  it('merges organizationId into where for findUnique without switching operations', async () => {
    const allOperations = createExtension();
    const query = jest.fn(async (args: unknown) => args);

    const result = (await TenantContext.run('org-1', () =>
      allOperations({
        model: 'Site',
        operation: 'findUnique',
        args: { where: { id: 'site-1' } },
        query,
      }),
    )) as { where: Record<string, unknown> };

    expect(query).toHaveBeenCalledTimes(1);
    expect(result.where).toEqual({ id: 'site-1', organizationId: 'org-1' });
  });

  it('stamps organizationId on every row for createMany', async () => {
    const allOperations = createExtension();
    const query = jest.fn(async (args: unknown) => args);

    const result = (await TenantContext.run('org-1', () =>
      allOperations({
        model: 'Site',
        operation: 'createMany',
        args: { data: [{ name: 'A' }, { name: 'B' }] },
        query,
      }),
    )) as { data: Record<string, unknown>[] };

    expect(result.data).toEqual([
      { name: 'A', organizationId: 'org-1' },
      { name: 'B', organizationId: 'org-1' },
    ]);
  });
});
