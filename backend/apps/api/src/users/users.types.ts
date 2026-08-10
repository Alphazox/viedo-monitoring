import { Prisma } from '@video-analytics/database';

export const userWithRolesInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userWithRolesInclude }>;

export function extractPermissions(user: UserWithRoles): string[] {
  const keys = new Set<string>();
  for (const userRole of user.roles) {
    for (const rolePermission of userRole.role.permissions) {
      keys.add(rolePermission.permission.key);
    }
  }
  return [...keys];
}

export function extractRoleNames(user: UserWithRoles): string[] {
  return user.roles.map((userRole) => userRole.role.name);
}

/** Lighter than userWithRolesInclude (id/name only) — enough for list/detail responses, no permissions needed there. */
export const userWithRoleNamesInclude = {
  roles: { include: { role: { select: { id: true, name: true } } } },
} satisfies Prisma.UserInclude;

export type UserWithRoleNames = Prisma.UserGetPayload<{ include: typeof userWithRoleNamesInclude }>;
