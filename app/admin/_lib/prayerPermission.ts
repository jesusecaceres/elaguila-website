export function adminCanManagePrayerWall(args: {
  enforceRoster: boolean;
  role: string | null;
  permissions: unknown;
}): boolean {
  if (!args.enforceRoster) return true;
  if (args.role === "super_admin") return true;
  const list = Array.isArray(args.permissions) ? args.permissions.filter((x): x is string => typeof x === "string") : [];
  return list.includes("can_manage_prayer_wall");
}
