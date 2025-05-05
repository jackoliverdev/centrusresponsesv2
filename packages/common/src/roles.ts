export const PLATFORM_ADMIN_ORG = {
  organizationId: 1,
  organizationName: "PLATFORM_ADMIN",
} as const;

export const USER_ROLES = {
  /**
   * Only role for the PLATFORM_ADMIN
   * organization. Not used for any
   * other organization.
   */
  superAdmin: "super-admin",

  /**
   * Controls and organization. There
   * must be one, and only one, on each
   * organization.
   */
  owner: "owner",

  /**
   * Manages an organization.
   */
  admin: "admin",

  /**
   * Regular user.
   */
  user: "user",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const ALL_USER_ROLES = [
  USER_ROLES.superAdmin,
  USER_ROLES.owner,
  USER_ROLES.admin,
  USER_ROLES.user,
] as const;

export const ROLE_LABELS = {
  [USER_ROLES.superAdmin]: "Super Admin",
  [USER_ROLES.owner]: "Owner",
  [USER_ROLES.admin]: "Admin",
  [USER_ROLES.user]: "User",
} as const;

type RoleHierarchy = {
  [role in UserRole]: UserRole[];
};

/**
 * Roles that any given role also have.
 */
export const ROLE_HIERARCHY: RoleHierarchy = {
  [USER_ROLES.superAdmin]: ["owner", "admin", "user"],
  [USER_ROLES.owner]: ["admin", "user"],
  [USER_ROLES.admin]: ["user"],
  [USER_ROLES.user]: [],
};

/**
 * Returns true if `role` or any other role
 * that `role` also have is included in `allowedRoles`
 */
export const isRoleAllowed = (
  role: UserRole | null | undefined,
  allowedRoles: UserRole[],
): boolean => {
  if (!role) return false;
  return allowedRoles.some((allowedRole) =>
    [role, ...ROLE_HIERARCHY[role]].includes(allowedRole),
  );
};
