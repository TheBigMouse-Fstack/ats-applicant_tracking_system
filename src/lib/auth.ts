import { UserRole } from "@/types";
export { hashPassword, verifyPassword } from "@/lib/password";

export interface SessionUser {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
