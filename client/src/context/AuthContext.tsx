import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "@/lib/api";
import {
  clearStoredToken,
  getStoredToken,
  persistToken,
} from "@/lib/auth";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "@/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  initializing: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload, remember?: boolean) => Promise<void>;
  register: (
    payload: RegisterPayload,
    remember?: boolean
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  const fetchCurrentUser = useCallback(async () => {
    // Always check for token in storage, not just state
    const currentToken = getStoredToken();
    
    if (!currentToken) {
      setUser(null);
      setToken(null);
      setInitializing(false);
      return;
    }

    // Update token state if it's different
    if (currentToken !== token) {
      setToken(currentToken);
    }

    try {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
    } catch (error) {
      clearStoredToken();
      setUser(null);
      setToken(null);
    } finally {
      setInitializing(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchCurrentUser();
  }, [fetchCurrentUser]);

  const handleAuthSuccess = useCallback(
    async (response: AuthResponse, remember: boolean) => {
      persistToken(response.token, remember);
      setToken(response.token);

      if (response.user) {
        setUser(response.user);
        return;
      }

      await fetchCurrentUser();
    },
    [fetchCurrentUser]
  );

  const login = useCallback(
    async (payload: LoginPayload, remember = true) => {
      try {
        const { data } = await api.post<AuthResponse>("/auth/login", payload);
        await handleAuthSuccess(data, remember);
      } catch (error) {
        // Re-throw the error so it can be handled by the calling component
        throw error;
      }
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (payload: RegisterPayload, remember = true) => {
      try {
        const { data } = await api.post<AuthResponse>("/auth/register", payload);
        await handleAuthSuccess(data, remember);
      } catch (error) {
        // Re-throw the error so it can be handled by the calling component
        throw error;
      }
    },
    [handleAuthSuccess]
  );

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      initializing,
      login,
      register,
      logout,
      refreshUser: fetchCurrentUser,
    }),
    [fetchCurrentUser, initializing, login, logout, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

