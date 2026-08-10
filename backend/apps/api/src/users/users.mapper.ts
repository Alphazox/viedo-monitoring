import type { UserWithRoleNames } from './users.types';

export type PublicUser = Omit<UserWithRoleNames, 'passwordHash' | 'roles'> & {
  roles: { id: string; name: string }[];
};

export function toPublicUser(user: UserWithRoleNames): PublicUser {
  const { passwordHash: _passwordHash, roles, ...rest } = user;
  return { ...rest, roles: roles.map((userRole) => userRole.role) };
}
