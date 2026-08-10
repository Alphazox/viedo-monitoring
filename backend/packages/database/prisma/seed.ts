import { PrismaClient } from '@prisma/client';
import { hashPassword, PERMISSION_DEFINITIONS } from '@video-analytics/common';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  for (const definition of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { key: definition.key },
      update: { description: definition.description },
      create: { key: definition.key, description: definition.description },
    });
  }

  const allPermissions = await prisma.permission.findMany();

  const orgName = process.env.ORG_NAME ?? 'Default Organization';
  const orgSlug = process.env.ORG_SLUG ?? 'default';

  const organization = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: { name: orgName, slug: orgSlug },
  });

  const superAdminRole = await prisma.role.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: 'SuperAdmin' } },
    update: {},
    create: {
      organizationId: organization.id,
      name: 'SuperAdmin',
      description: 'Full platform access',
      isSystem: true,
    },
  });

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: superAdminRole.id } }),
    prisma.rolePermission.createMany({
      data: allPermissions.map((permission) => ({
        roleId: superAdminRole.id,
        permissionId: permission.id,
      })),
    }),
  ]);

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD must be set to seed the bootstrap admin user');
  }

  const passwordHash = await hashPassword(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      organizationId: organization.id,
      email: adminEmail,
      passwordHash,
      firstName: 'System',
      lastName: 'Administrator',
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: superAdminRole.id },
  });

  console.log(
    `Seed complete. Organization: ${organization.name} (${organization.id}). ` +
      `Permissions: ${allPermissions.length}. Bootstrap admin: ${adminEmail}`,
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
