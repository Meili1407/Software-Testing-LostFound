export type RoleName = "STUDENT" | "STAFF" | "ADMIN";

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: RoleName;
}
