import { router, useSegments } from 'expo-router';
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useReducer } from 'react';

import { login as loginService } from '@/services/authService';
import { clearStoredSession, getStoredSession, setStoredSession } from '@/storage/authStorage';
import { AuthState, User } from '@/types/auth';

type AuthAction =
  | { type: 'RESTORE_SESSION'; payload: { user: User | null; token: string | null } }
  | { type: 'SIGN_IN'; payload: { user: User; token: string } }
  | { type: 'SIGN_OUT' };

interface AuthContextValue {
  state: AuthState;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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

function authReducer(current: InternalAuthState, action: AuthAction): InternalAuthState {
  switch (action.type) {
    case 'RESTORE_SESSION':
      return {
        state: {
          isLoading: false,
          isSignout: false,
          userToken: action.payload.token,
        },
        user: action.payload.user,
      };
    case 'SIGN_IN':
      return {
        state: {
          isLoading: false,
          isSignout: false,
          userToken: action.payload.token,
        },
        user: action.payload.user,
      };
    case 'SIGN_OUT':
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

  useEffect(() => {
    async function bootstrapSession(): Promise<void> {
      try {
        const session = await getStoredSession();

        dispatch({
          type: 'RESTORE_SESSION',
          payload: {
            user: session.user,
            token: session.token,
          },
        });
      } catch {
        dispatch({
          type: 'RESTORE_SESSION',
          payload: { user: null, token: null },
        });
      }
    }

    bootstrapSession();
  }, []);

  useEffect(() => {
    if (internalState.state.isLoading) {
      return;
    }

    const isAuthGroup = segments[0] === '(auth)';
    const hasToken = Boolean(internalState.state.userToken);

    if (!hasToken && !isAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (hasToken && isAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [internalState.state.isLoading, internalState.state.userToken, segments]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      state: internalState.state,
      user: internalState.user,
      signIn: async (email: string, password: string) => {
        const user = await loginService(email, password);
        await setStoredSession(user);
        dispatch({
          type: 'SIGN_IN',
          payload: { user, token: user.token },
        });
      },
      signOut: async () => {
        await clearStoredSession();
        dispatch({ type: 'SIGN_OUT' });
      },
    }),
    [internalState.state, internalState.user]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
