export interface CurrentUser {
  id: number;
  username: string;
  role: string;
  permissions: string[];
}