import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '../rbac/permissions.catalog';

export const PERMISSIONS_KEY = 'permissions';

/** Declares the permission keys required to access a route; read by PermissionsGuard. */
export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
