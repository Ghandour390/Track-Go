import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import { User } from "@/types/auth";

const AUTH_STORAGE_USER_KEY = "trackgo.auth.user";
const AUTH_STORAGE_TOKEN_KEY = "trackgo.auth.token";
const AUTH_STORAGE_PIN_KEY = "trackgo.auth.pin";

async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) return value;
  } catch {}

  return AsyncStorage.getItem(key);
}

async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}

  await AsyncStorage.removeItem(key);
}

interface StoredSession {
  user: User | null;
  token: string | null;
}

export async function getStoredSession(): Promise<StoredSession> {
  const [rawUserValue, tokenValue] = await Promise.all([
    secureGet(AUTH_STORAGE_USER_KEY),
    secureGet(AUTH_STORAGE_TOKEN_KEY),
  ]);

  return {
    user: rawUserValue ? (JSON.parse(rawUserValue) as User) : null,
    token: tokenValue ?? null,
  };
}

export async function setStoredSession(user: User): Promise<void> {
  await Promise.all([
    secureSet(AUTH_STORAGE_USER_KEY, JSON.stringify(user)),
    secureSet(AUTH_STORAGE_TOKEN_KEY, user.token),
  ]);
}

export async function clearStoredSession(): Promise<void> {
  await Promise.all([
    secureDelete(AUTH_STORAGE_USER_KEY),
    secureDelete(AUTH_STORAGE_TOKEN_KEY),
  ]);
}

export async function getStoredPin(): Promise<string | null> {
  return secureGet(AUTH_STORAGE_PIN_KEY);
}

export async function setStoredPin(pin: string): Promise<void> {
  await secureSet(AUTH_STORAGE_PIN_KEY, pin);
}
