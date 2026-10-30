import { createContext } from "react";
import type { CurrentUser } from "../types/auth";

export interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (code: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);