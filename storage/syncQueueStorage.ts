import AsyncStorage from "@react-native-async-storage/async-storage";

const SYNC_QUEUE_STORAGE_KEY = "trackgo.sync.queue.v1";

export async function getStoredSyncQueue<T>(): Promise<T[]> {
  const raw = await AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function setStoredSyncQueue<T>(queue: T[]): Promise<void> {
  await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}
