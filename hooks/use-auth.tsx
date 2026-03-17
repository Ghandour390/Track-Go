import { router, useSegments } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import { AppState } from "react-native";

import { login as loginService } from "@/services/authService";
import {
  startLocationTracking,
  stopLocationTracking,
} from "@/services/locationTrackingService";
import {
  clearStoredSession,
  getStoredPin,
  getStoredSession,
  setStoredPin,
  setStoredSession,
} from "@/storage/authStorage";
import { AuthState, User } from "@/types/auth";

type AuthAction =
  | {
      type: "RESTORE_SESSION";
      payload: { user: User | null; token: string | null };
    }
  | { type: "SIGN_IN"; payload: { user: User; token: string } }
  | { type: "SIGN_OUT" };

interface AuthContextValue {
  state: AuthState;
  user: User | null;
  isLocked: boolean;
  hasPin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  savePin: (pin: string) => Promise<void>;
}

interface InternalAuthState {
  state: AuthState;
  user: User | null;
}

const initialState: InternalAuthState = {
  state: {
    isLoading: true,
    isSignout: false,
    userToken: null,
  },
  user: null,
};

function authReducer(
  current: InternalAuthState,
  action: AuthAction,
): InternalAuthState {
  switch (action.type) {
    case "RESTORE_SESSION":
      return {
        state: {
          isLoading: false,
          isSignout: false,
          userToken: action.payload.token,
        },
        user: action.payload.user,
      };
    case "SIGN_IN":
      return {
        state: {
          isLoading: false,
          isSignout: false,
          userToken: action.payload.token,
        },
        user: action.payload.user,
      };
    case "SIGN_OUT":
      return {
        state: {
          isLoading: false,
          isSignout: true,
          userToken: null,
        },
        user: null,
      };
    default:
      return current;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const segments = useSegments();
  const [internalState, dispatch] = useReducer(authReducer, initialState);
  const [isLocked, setIsLocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    async function bootstrapSession(): Promise<void> {
      try {
        const session = await getStoredSession();

        dispatch({
          type: "RESTORE_SESSION",
          payload: {
            user: session.user,
            token: session.token,
          },
        });
      } catch {
        dispatch({
          type: "RESTORE_SESSION",
          payload: { user: null, token: null },
        });
      }
    }

    bootstrapSession();
  }, []);

  useEffect(() => {
    void getStoredPin().then((pin) => {
      setHasPin(Boolean(pin));
    });
  }, []);

  useEffect(() => {
    if (internalState.state.isLoading) {
      return;
    }

    const isAuthGroup = segments[0] === "(auth)";
    const hasToken = Boolean(internalState.state.userToken);

    if (!hasToken && !isAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    if (hasToken && isAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [internalState.state.isLoading, internalState.state.userToken, segments]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (!internalState.state.userToken) {
        return;
      }

      if (nextState === "background" || nextState === "inactive") {
        setIsLocked(true);
      }
    });

    return () => subscription.remove();
  }, [internalState.state.userToken]);

  useEffect(() => {
    if (internalState.state.isLoading) {
      return;
    }

    if (internalState.state.userToken) {
      void startLocationTracking();
      return;
    }

    void stopLocationTracking();
  }, [internalState.state.isLoading, internalState.state.userToken]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      state: internalState.state,
      user: internalState.user,
      signIn: async (email: string, password: string) => {
        const user = await loginService(email, password);
        await setStoredSession(user);
        dispatch({
          type: "SIGN_IN",
          payload: { user, token: user.token },
        });
        setIsLocked(false);
      },
      signOut: async () => {
        await clearStoredSession();
        dispatch({ type: "SIGN_OUT" });
        setIsLocked(false);
      },
      isLocked,
      hasPin,
      unlockWithBiometrics: async () => {
        try {
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();

          if (!compatible || !enrolled) {
            return false;
          }

          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Déverrouiller Track&Go",
            fallbackLabel: "Utiliser le code PIN",
            disableDeviceFallback: true,
          });

          if (!result.success) {
            return false;
          }

          setIsLocked(false);
          return true;
        } catch {
          return false;
        }
      },
      unlockWithPin: async (pin: string) => {
        const storedPin = await getStoredPin();
        const isValid = Boolean(storedPin && storedPin === pin.trim());
        if (isValid) {
          setIsLocked(false);
        }
        return isValid;
      },
      savePin: async (pin: string) => {
        await setStoredPin(pin.trim());
        setHasPin(true);
      },
    }),
    [hasPin, internalState.state, internalState.user, isLocked],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
