export const ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  HR: "hr",
  EMPLOYEE: "employee",
  // Backward-compatible keys for existing modules
  SUPER_ADMIN: "superadmin",
  COMPANY_ADMIN: "admin",
};

export const ROLE_OPTIONS = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE];
