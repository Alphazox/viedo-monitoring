/**
 * One-time data migration: run against a database that already has the
 * additive Phase 3 schema applied (Organization table exists; User.organizationId
 * and Role.organizationId exist but are still nullable) and BEFORE the
 * follow-up migration that makes those columns NOT NULL.
 *
 * Safe to run on a fresh, empty database too — it just creates the default
 * Organization and finds nothing to backfill.
 *
 * Usage: run once, then apply the second migration (NOT NULL + Role's
 * per-organization uniqueness). See docs/LLD/phase-3-multi-tenancy-foundation.md §6.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const name = process.env.DEFAULT_ORG_NAME ?? 'Default Organization';
  const slug = process.env.DEFAULT_ORG_SLUG ?? 'default';

  const organization = await prisma.organization.upsert({
    where: { slug },
    update: {},
    create: { name, slug },
  });

  const users = await prisma.user.updateMany({
    where: { organizationId: null },
    data: { organizationId: organization.id },
  });

  const roles = await prisma.role.updateMany({
    where: { organizationId: null },
    data: { organizationId: organization.id },
  });

  console.log(
    `Backfill complete. Organization: ${organization.name} (${organization.id}). ` +
      `Users assigned: ${users.count}. Roles assigned: ${roles.count}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
