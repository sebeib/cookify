import type { User } from "../types";

export const ADMIN_ROLE_ID = "c0a8012e-8b7d-4f5b-9c59-7f8f15a0b201";

export function isAdmin(user: User | null) {
  return user?.roleId === ADMIN_ROLE_ID;
}
