import { api, tokenStorage } from "../api/client";
import type {
  CurrentUser,
  Permission,
  Role,
  RoleCreate,
  UserCreate,
  UserSummary,
  UserUpdate,
} from "../types/auth";

export function hasStoredToken(): boolean {
  return tokenStorage.get() !== null;
}

export async function getMe(): Promise<CurrentUser> {
  const { data } = await api.get<CurrentUser>("/auth/me");
  return data;
}

export async function login(username: string, password: string): Promise<CurrentUser> {
  const { data } = await api.post<{ accessToken: string }>("/auth/login", {
    username,
    password,
  });
  tokenStorage.set(data.accessToken);
  return getMe();
}

export function logout(): void {
  tokenStorage.clear();
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.post("/auth/changePassword", { currentPassword, newPassword });
}

// ---------- Permisos y roles ----------

export async function getPermissions(): Promise<Permission[]> {
  const { data } = await api.get<Permission[]>("/auth/permissions");
  return data;
}

export async function getRoles(): Promise<Role[]> {
  const { data } = await api.get<Role[]>("/auth/roles");
  return data;
}

export async function createRole(payload: RoleCreate): Promise<Role> {
  const { data } = await api.post<Role>("/auth/roles", payload);
  return data;
}
export async function updateRole(id: number, payload: RoleCreate): Promise<Role> {
  const { data } = await api.put<Role>(`/auth/roles/${id}`, payload);
  return data;
}

// ---------- Usuarios ----------

export async function getUsers(): Promise<UserSummary[]> {
  const { data } = await api.get<UserSummary[]>("/auth/users");
  return data;
}

export async function createUser(payload: UserCreate): Promise<UserSummary> {
  const { data } = await api.post<UserSummary>("/auth/users", payload);
  return data;
}

export async function updateUser(id: number, payload: UserUpdate): Promise<UserSummary> {
  const { data } = await api.patch<UserSummary>(`/auth/users/${id}`, payload);
  return data;
}

export async function resetPassword(id: number, newPassword: string): Promise<void> {
  await api.put(`/auth/users/${id}/password`, { newPassword });
}