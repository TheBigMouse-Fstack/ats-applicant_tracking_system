import "server-only";
import { z } from "zod";
import type { UserRole } from "@/types";

export const UserRoleSchema = z.enum(["ADMIN", "HR", "HIRING_MANAGER"]);

export const PermissionSchema = z.enum([
  "dashboard:read",
  "pipeline:read",
  "pipeline:move",
  "applications:read",
  "applications:star",
  "applications:profile:write",
  "applications:reparse",
  "applications:cv:read",
  "jobs:read",
  "jobs:write",
  "jobs:approve",
  "interviews:schedule",
  "interviews:notes:write",
  "interviews:trigger-n8n",
  "scorecards:read",
  "scorecards:write",
  "talent-pool:read",
  "talent-pool:write",
  "talent-pool:cleanup",
  "export:read",
  "notifications:read",
  "users:read",
  "users:write",
  "auth:change-password",
]);

export type Permission = z.infer<typeof PermissionSchema>;

const ALL_PERMISSIONS: ReadonlySet<Permission> = new Set(PermissionSchema.options);

const HR_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  "dashboard:read",
  "pipeline:read",
  "pipeline:move",
  "applications:read",
  "applications:star",
  "applications:profile:write",
  "applications:reparse",
  "applications:cv:read",
  "jobs:read",
  "jobs:write",
  "interviews:notes:write",
  "interviews:trigger-n8n",
  "scorecards:read",
  "scorecards:write",
  "talent-pool:read",
  "talent-pool:write",
  "export:read",
  "notifications:read",
  "auth:change-password",
]);

const HIRING_MANAGER_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>([
  "dashboard:read",
  "pipeline:read",
  "pipeline:move",
  "applications:read",
  "applications:star",
  "applications:cv:read",
  "jobs:read",
  "jobs:approve",
  "interviews:schedule",
  "interviews:notes:write",
  "interviews:trigger-n8n",
  "scorecards:read",
  "scorecards:write",
  "notifications:read",
  "auth:change-password",
]);

export type DalRole = z.infer<typeof UserRoleSchema>;

export const ROLE_PERMISSIONS: Partial<Record<UserRole, ReadonlySet<Permission>>> = {
  ADMIN: ALL_PERMISSIONS,
  HR: HR_PERMISSIONS,
  HIRING_MANAGER: HIRING_MANAGER_PERMISSIONS,
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
