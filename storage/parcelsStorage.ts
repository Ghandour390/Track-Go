import AsyncStorage from "@react-native-async-storage/async-storage";

import type { Parcel } from "@/types/parcel";

const PARCELS_STORAGE_KEY = "trackgo.parcels.v1";

export async function getStoredParcels(): Promise<Parcel[] | null> {
  const raw = await AsyncStorage.getItem(PARCELS_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Parcel[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function setStoredParcels(parcels: Parcel[]): Promise<void> {
  await AsyncStorage.setItem(PARCELS_STORAGE_KEY, JSON.stringify(parcels));
}
