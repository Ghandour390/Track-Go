import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { useParcels } from "@/hooks/use-parcels";

export default function HomeScreen() {
  const { user } = useAuth();
  const { parcels, pendingSyncCount, isSyncing, isOnline } = useParcels();

  const stats = useMemo(() => {
    const total = parcels.length;
    const delivered = parcels.filter(
      (parcel) => parcel.status === "Livré",
    ).length;
    const incidents = parcels.filter(
      (parcel) => parcel.status === "Incident",
    ).length;
    const remaining = parcels.filter(
      (parcel) => parcel.status === "À livrer",
    ).length;
    const progress = total === 0 ? 0 : Math.round((delivered / total) * 100);
    return { total, delivered, incidents, remaining, progress };
  }, [parcels]);

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Track&Go</Text>
      <Text style={styles.title}>Tableau de bord</Text>
      <Text style={styles.subtitle}>Livreur: {user?.nom ?? "inconnu"}</Text>

      <View style={styles.statsCard}>
        <Text style={styles.progress}>
          {stats.progress}% de la tournée réalisée
        </Text>
        <Text style={styles.detail}>
          {stats.delivered}/{stats.total} livrés • {stats.remaining} restants •{" "}
          {stats.incidents} incidents
        </Text>
        <Text style={styles.detail}>
          ☁️ {isOnline ? "En ligne" : "Hors ligne"} •{" "}
          {isSyncing ? "sync…" : "stable"} • {pendingSyncCount} en attente
        </Text>
      </View>

      <View style={styles.actionsGrid}>
        <QuickAction
          title="Ma tournée"
          subtitle="Liste des colis"
          onPress={() => router.push("../tournee")}
        />
        <QuickAction
          title="Scanner"
          subtitle="Validation colis"
          onPress={() => router.push("../scan")}
        />
        <QuickAction
          title="Carte"
          subtitle="Suivi positions"
          onPress={() => router.push("../carte")}
        />
        <QuickAction
          title="Performance"
          subtitle="Statistiques"
          onPress={() => router.push("../performance")}
        />
      </View>
    </View>
  );
}

function QuickAction({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && styles.actionPressed,
      ]}
    >
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    padding: 16,
  },
  kicker: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    marginBottom: 14,
  },
  statsCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  progress: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
  detail: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
  },
  actionsGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 12,
  },
  actionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },
  actionSubtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
  },
});
