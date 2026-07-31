import { createContext } from "react";
import type { User } from "@/api/types";

export interface RegisterInput {
  email: string;
  password: string;
  full_name?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
