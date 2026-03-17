import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

const LOCATION_TASK_NAME = "trackgo-background-location";
const LAST_LOCATION_KEY = "trackgo.last.location";

type StoredLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  timestamp: string;
};

if (!TaskManager.isTaskDefined(LOCATION_TASK_NAME)) {
  TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) return;

    const payload = data as
      | { locations?: Location.LocationObject[] }
      | undefined;
    const latest = payload?.locations?.[0];

    if (!latest) return;

    const next: StoredLocation = {
      latitude: latest.coords.latitude,
      longitude: latest.coords.longitude,
      accuracy: latest.coords.accuracy,
      timestamp: new Date(latest.timestamp).toISOString(),
    };

    await AsyncStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(next));
  });
}

export async function getLastTrackedLocation(): Promise<StoredLocation | null> {
  const raw = await AsyncStorage.getItem(LAST_LOCATION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredLocation;
  } catch {
    return null;
  }
}

export async function startLocationTracking(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    return false;
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== "granted") {
    return false;
  }

  const alreadyStarted =
    await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);

  if (!alreadyStarted) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60_000,
      distanceInterval: 50,
      pausesUpdatesAutomatically: true,
      foregroundService: {
        notificationTitle: "Track&Go",
        notificationBody: "Suivi de position actif pendant la tournée",
      },
    });
  }

  return true;
}

export async function stopLocationTracking(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }

  const started =
    await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (!started) {
    return;
  }

  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
}
