import { createContext } from "react";
import type { AuthUser } from "./authTypes";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (args: { email: string; password: string }) => Promise<void>;
  signup: (args: { name: string; email: string; password: string }) => Promise<void>;
  guest: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
export type { AuthContextValue };
