import AsyncStorage from '@react-native-async-storage/async-storage';

import { User } from '@/types/auth';

const AUTH_STORAGE_USER_KEY = 'trackgo.auth.user';
const AUTH_STORAGE_TOKEN_KEY = 'trackgo.auth.token';

interface StoredSession {
  user: User | null;
  token: string | null;
}

export async function getStoredSession(): Promise<StoredSession> {
  const [rawUserEntry, tokenEntry] = await AsyncStorage.multiGet([
    AUTH_STORAGE_USER_KEY,
    AUTH_STORAGE_TOKEN_KEY,
  ]);

  const rawUserValue = rawUserEntry[1];
  const tokenValue = tokenEntry[1];

  return {
    user: rawUserValue ? (JSON.parse(rawUserValue) as User) : null,
    token: tokenValue ?? null,
  };
}

export async function setStoredSession(user: User): Promise<void> {
  await AsyncStorage.multiSet([
    [AUTH_STORAGE_USER_KEY, JSON.stringify(user)],
    [AUTH_STORAGE_TOKEN_KEY, user.token],
  ]);
}

export async function clearStoredSession(): Promise<void> {
  await AsyncStorage.multiRemove([AUTH_STORAGE_USER_KEY, AUTH_STORAGE_TOKEN_KEY]);
}
