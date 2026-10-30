import { api, tokenStorage } from "../api/client";
import type { CurrentUser } from "../types/auth";

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