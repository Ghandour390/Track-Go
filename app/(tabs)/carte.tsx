import * as Location from "expo-location";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { useParcels } from "@/hooks/use-parcels";
import { getLastTrackedLocation } from "@/services/locationTrackingService";

export default function CarteScreen() {
  const { parcels } = useParcels();
  const [isLocating, setIsLocating] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    async function loadLocation() {
      const lastTracked = await getLastTrackedLocation();
      if (lastTracked) {
        setDriverLocation({
          latitude: lastTracked.latitude,
          longitude: lastTracked.longitude,
        });
      }

      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        setIsLocating(false);
        return;
      }

      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setDriverLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        });
      } finally {
        setIsLocating(false);
      }
    }

    void loadLocation();
  }, []);

  const parcelMarkers = useMemo(
    () => parcels.filter((parcel) => parcel.location),
    [parcels],
  );

  const initialRegion = useMemo(() => {
    if (driverLocation) {
      return {
        latitude: driverLocation.latitude,
        longitude: driverLocation.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };
    }

    const firstParcel = parcelMarkers[0]?.location;
    return {
      latitude: firstParcel?.lat ?? 33.5731,
      longitude: firstParcel?.lng ?? -7.5898,
      latitudeDelta: 0.12,
      longitudeDelta: 0.12,
    };
  }, [driverLocation, parcelMarkers]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Carte de tournée</Text>
        <Text style={styles.subtitle}>{parcelMarkers.length} destinations</Text>
      </View>

      <MapView style={styles.map} initialRegion={initialRegion}>
        {driverLocation ? (
          <Marker
            coordinate={driverLocation}
            title="Position actuelle"
            pinColor="#2563EB"
          />
        ) : null}

        {parcelMarkers.map((parcel) => (
          <Marker
            key={parcel.id}
            coordinate={{
              latitude: parcel.location!.lat,
              longitude: parcel.location!.lng,
            }}
            title={parcel.recipientName}
            description={`${parcel.id} • ${parcel.status}`}
            pinColor={
              parcel.status === "Livré"
                ? "#10B981"
                : parcel.status === "Incident"
                  ? "#EF4444"
                  : "#F59E0B"
            }
          />
        ))}
      </MapView>

      {isLocating ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loadingText}>
            Récupération de votre position…
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  header: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "white",
  },
  subtitle: {
    marginTop: 4,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 92,
    backgroundColor: "rgba(11,18,32,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
});
