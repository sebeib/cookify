import { createContext, startTransition, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import * as api from "../api";
import type { LoginResponse, User } from "../types";
import { clearAuthSession, loadAuthSession, saveAuthSession } from "./storage";

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  sessionId: string | null;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setCurrentUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthState = {
  sessionId: string | null;
  user: User | null;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const persistedSession = loadAuthSession();
  const [authState, setAuthState] = useState<AuthState>({
    sessionId: persistedSession?.sessionId ?? null,
    user: persistedSession?.user ?? null,
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const isResettingSessionRef = useRef(false);
  const setCurrentUser = useCallback((user: User) => {
    setAuthState((currentState) => {
      if (!currentState.sessionId) {
        return currentState;
      }

      const nextState = {
        sessionId: currentState.sessionId,
        user,
      };

      saveAuthSession(nextState);
      return nextState;
    });
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler((message) => {
      if (isResettingSessionRef.current) {
        return;
      }

      isResettingSessionRef.current = true;
      clearAuthSession();
      setAuthState({ sessionId: null, user: null });

      notifications.show({
        color: "red",
        title: "Sitzung abgelaufen",
        message: message || "Bitte melde dich erneut an.",
      });

      startTransition(() => navigate("/login", { replace: true }));
    });

    return () => {
      api.setUnauthorizedHandler(null);
    };
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(authState.sessionId && authState.user),
      isLoggingIn,
      sessionId: authState.sessionId,
      user: authState.user,
      login: async (username: string, password: string) => {
        setIsLoggingIn(true);

        try {
          const response = await api.login(username, password);
          handleSuccessfulLogin(response);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Anmeldung fehlgeschlagen.";
          notifications.show({
            color: "red",
            title: "Anmeldung fehlgeschlagen",
            message,
          });
          throw error;
        } finally {
          setIsLoggingIn(false);
        }
      },
      logout: async () => {
        const token = authState.sessionId;

        try {
          await api.logout(token);
        } catch {
          // Clear the local session even if the backend already invalidated it.
        } finally {
          clearAuthSession();
          setAuthState({ sessionId: null, user: null });
          startTransition(() => navigate("/login", { replace: true }));
        }
      },
      setCurrentUser,
    }),
    [authState.sessionId, authState.user, isLoggingIn, navigate, setCurrentUser],
  );

  function handleSuccessfulLogin(response: LoginResponse) {
    isResettingSessionRef.current = false;

    saveAuthSession({
      sessionId: response.sessionId,
      user: response.user,
    });

    setAuthState({
      sessionId: response.sessionId,
      user: response.user,
    });

    notifications.show({
      color: "teal",
      title: "Willkommen zurueck",
      message: `Du bist jetzt als ${response.user.displayName} angemeldet.`,
    });

    startTransition(() => navigate("/", { replace: true }));
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
