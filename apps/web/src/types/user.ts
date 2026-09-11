export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: "TEAM_MEMBER" | "MANAGER";
  isActive: boolean;
}
