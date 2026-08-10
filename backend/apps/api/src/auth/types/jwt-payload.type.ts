export interface JwtPayload {
  sub: string;
  organizationId: string;
  email: string;
  roles: string[];
  permissions: string[];
}
