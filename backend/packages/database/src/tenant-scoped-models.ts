/**
 * Prisma model names (as they appear in schema.prisma, PascalCase) that carry
 * an `organizationId` column and must be automatically scoped by
 * TenantPrismaService. CameraGroupMembership is deliberately excluded — same
 * reasoning as UserRole/RolePermission: it's a join table reached only
 * through an already-scoped Camera or CameraGroup query, never queried
 * standalone.
 */
export const TENANT_SCOPED_MODELS = [
  'Site',
  'Building',
  'Floor',
  'Zone',
  'User',
  'Role',
  'Camera',
  'CameraGroup',
  'Recording',
] as const;

export type TenantScopedModel = (typeof TENANT_SCOPED_MODELS)[number];
