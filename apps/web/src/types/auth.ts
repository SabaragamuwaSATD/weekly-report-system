export type Role = "TEAM_MEMBER" | "MANAGER";

export interface CurrentUser {
  userId: string;
  email: string;
  role: Role;
}
