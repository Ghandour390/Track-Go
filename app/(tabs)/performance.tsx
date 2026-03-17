import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useParcels } from "@/hooks/use-parcels";

export default function PerformanceScreen() {
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
    const avgDistance =
      total === 0
        ? 0
        : parcels.reduce((sum, parcel) => sum + parcel.distanceKm, 0) / total;

    return {
      total,
      delivered,
      incidents,
      remaining,
      progress,
      avgDistance: avgDistance.toFixed(1),
    };
  }, [parcels]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance tournée</Text>
      <Text style={styles.syncBadge}>
        ☁️ {isOnline ? "En ligne" : "Hors ligne"} • {pendingSyncCount} en
        attente
      </Text>

      <View style={styles.grid}>
        <StatCard label="Progression" value={`${stats.progress}%`} />
        <StatCard label="Livrés" value={`${stats.delivered}/${stats.total}`} />
        <StatCard label="Incidents" value={`${stats.incidents}`} />
        <StatCard label="Distance moyenne" value={`${stats.avgDistance} km`} />
      </View>

      <View style={styles.syncCard}>
        <Text style={styles.syncTitle}>Synchronisation</Text>
        <Text style={styles.syncText}>
          Actions en attente: {pendingSyncCount}
        </Text>
        <Text style={styles.syncText}>
          {isSyncing ? "État: en cours…" : "État: à jour"}
        </Text>
      </View>

      <Text style={styles.subtle}>
        Restants: {stats.remaining} colis à traiter.
      </Text>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "white",
    marginBottom: 12,
  },
  syncBadge: {
    marginBottom: 10,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 12,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    fontWeight: "800",
  },
  cardValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 8,
  },
  syncCard: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 12,
    gap: 4,
  },
  syncTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },
  syncText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    fontWeight: "700",
  },
  subtle: {
    marginTop: 12,
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "700",
  },
});
