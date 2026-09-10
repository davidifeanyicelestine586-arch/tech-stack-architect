export const ADMIN_ROLE = "admin";

export function getUserRole(user) {
  const role = user?.app_metadata?.role;
  return typeof role === "string" ? role : null;
}

export function isAdminUser(user) {
  return getUserRole(user) === ADMIN_ROLE;
}
