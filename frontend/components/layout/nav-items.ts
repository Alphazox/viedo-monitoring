export interface NavItem {
  href: string;
  label: string;
  /** Only shown if the current user holds this permission; undefined = always shown. */
  permission?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/cameras', label: 'Cameras', permission: 'cameras:read' },
  { href: '/camera-groups', label: 'Camera Groups', permission: 'camera-groups:read' },
  { href: '/recordings', label: 'Recordings', permission: 'recordings:read' },
  { href: '/locations', label: 'Locations', permission: 'sites:read' },
  { href: '/users', label: 'Users', permission: 'users:read' },
  { href: '/roles', label: 'Roles', permission: 'roles:read' },
  { href: '/audit-log', label: 'Audit Log', permission: 'audit-logs:read' },
  { href: '/settings', label: 'Organization', permission: 'organizations:read' },
];
