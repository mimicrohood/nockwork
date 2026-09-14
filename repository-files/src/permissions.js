export const PERMISSIONS = Object.freeze([
  "clock:read",
  "network:fetch",
  "storage:read",
  "storage:write",
  "user:notify"
]);

const known = new Set(PERMISSIONS);

export function validatePermissions(requested) {
  if (!Array.isArray(requested)) throw new TypeError("permissions must be an array");
  const unique = [...new Set(requested)];
  for (const permission of unique) {
    if (!known.has(permission)) {
      throw new Error("Unknown permission: " + permission);
    }
  }
  return unique.sort();
}

export function assertPermission(granted, permission) {
  if (!granted.has(permission)) {
    throw new Error("Capability denied: " + permission);
  }
}
