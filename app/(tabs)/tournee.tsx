import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useParcels } from "@/hooks/use-parcels";
import type { Parcel, ParcelStatus } from "@/types/parcel";

const FILTERS: { key: "Tous" | ParcelStatus; label: string }[] = [
  { key: "Tous", label: "Tous" },
  { key: "À livrer", label: "À livrer" },
  { key: "Livré", label: "Livré" },
  { key: "Incident", label: "Incident" },
];

function clampText(s: string, max = 44) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export default function TourneeScreen() {
  const { parcels, refresh } = useParcels();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("Tous");
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const stats = useMemo(() => {
    const total = parcels.length;
    const delivered = parcels.filter((p) => p.status === "Livré").length;
    const incidents = parcels.filter((p) => p.status === "Incident").length;
    const remaining = parcels.filter((p) => p.status === "À livrer").length;
    const progress = total === 0 ? 0 : Math.round((delivered / total) * 100);
    return { total, delivered, incidents, remaining, progress };
  }, [parcels]);

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parcels
      .filter((p) => {
        const matchesFilter = filter === "Tous" ? true : p.status === filter;
        const matchesQuery =
          q.length === 0
            ? true
            : [
                p.id,
                p.trackingCode,
                p.recipientName,
                p.addressLine,
                p.city,
                p.status,
              ].some((x) => x.toLowerCase().includes(q));
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => {
        // option: priorité express en premier, puis distance
        const prA = a.priority === "Express" ? 0 : 1;
        const prB = b.priority === "Express" ? 0 : 1;
        if (prA !== prB) return prA - prB;
        return a.distanceKm - b.distanceKm;
      });
  }, [parcels, query, filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const goToDetails = (id: string) => {
    // Si tu utilises le module "parcels" (ou "colis"), adapte ce chemin.
    // Exemple: router.push({ pathname: "/parcels/[id]", params: { id } })
    router.push({ pathname: "/parcel/[id]", params: { id } });
  };

  const renderItem = useCallback(
    ({ item }: { item: Parcel }) => (
      <Pressable
        onPress={() => goToDetails(item.id)}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      >
        <View style={styles.cardTopRow}>
          <View style={styles.cardBadgeRow}>
            <StatusChip status={item.status} />
            {item.priority === "Express" ? (
              <Pill label="Express" tone="purple" />
            ) : (
              <Pill label="Normal" tone="gray" />
            )}
          </View>

          <View style={styles.metaRight}>
            <Text style={styles.metaSmall}>ETA</Text>
            <Text style={styles.metaBig}>{item.eta}</Text>
          </View>
        </View>

        <View style={styles.cardMainRow}>
          <Image source={{ uri: item.photoUrl }} style={styles.thumb} />
          <View style={styles.cardBody}>
            <Text style={styles.title}>{item.recipientName}</Text>
            <Text style={styles.subtitle}>
              {clampText(item.addressLine)} • {item.city}
            </Text>

            <View style={styles.codeRow}>
              <Text style={styles.codeLabel}>ID</Text>
              <Text style={styles.codeValue}>{item.id}</Text>
              <View style={styles.dot} />
              <Text style={styles.codeLabel}>Code</Text>
              <Text style={styles.codeValue}>{item.trackingCode}</Text>
            </View>

            {!!item.note && (
              <Text style={styles.noteText} numberOfLines={2}>
                {item.note}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.cardActions}>
          <View style={styles.distancePill}>
            <Text style={styles.distanceText}>
              📍 {item.distanceKm.toFixed(1)} km
            </Text>
          </View>

          <View style={styles.actionsRight}>
            <Pressable
              onPress={() => goToDetails(item.id)}
              style={({ pressed }) => [
                styles.btnGhost,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.btnGhostText}>Détails</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push(`/parcel/${item.id}/scan`)}
              style={({ pressed }) => [
                styles.btnPrimary,
                pressed && styles.btnPressed,
              ]}
            >
              <Text style={styles.btnPrimaryText}>Scanner</Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    ),
    [],
  );

  const getItemLayout = useCallback(
    (_: ArrayLike<Parcel> | null | undefined, index: number) => {
      const ITEM_HEIGHT = 242;
      return { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index };
    },
    [],
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Header moderne */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerKicker}>Track&Go</Text>
            <Text style={styles.headerTitle}>Ma tournée</Text>
          </View>
          <Pressable
            onPress={() => router.push("../../../(tabs)/carte")}
            style={({ pressed }) => [
              styles.headerBtn,
              pressed && styles.headerBtnPressed,
            ]}
          >
            <Text style={styles.headerBtnText}>Ouvrir Carte</Text>
          </Pressable>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>
              {stats.delivered}/{stats.total} livrés • {stats.remaining}{" "}
              restants • {stats.incidents} incidents
            </Text>
            <Text style={styles.progressPct}>{stats.progress}%</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${stats.progress}%` }]}
            />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher (nom, ID, adresse, statut)…"
            placeholderTextColor="rgba(255,255,255,0.55)"
            style={styles.searchInput}
          />
          <Pressable
            onPress={() => setQuery("")}
            style={({ pressed }) => [
              styles.clearBtn,
              pressed && styles.headerBtnPressed,
            ]}
          >
            <Text style={styles.clearBtnText}>×</Text>
          </Pressable>
        </View>

        {/* Filters */}
        <View style={styles.filtersRow}>
          {FILTERS.map((f) => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={({ pressed }) => [
                  styles.filterPill,
                  active && styles.filterPillActive,
                  pressed && styles.filterPillPressed,
                ]}
              >
                <Text
                  style={[styles.filterText, active && styles.filterTextActive]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Liste */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // perf basique
        initialNumToRender={6}
        windowSize={8}
        removeClippedSubviews
        getItemLayout={getItemLayout}
      />
    </View>
  );
}

function StatusChip({ status }: { status: ParcelStatus }) {
  const tone =
    status === "Livré"
      ? styles.chipGreen
      : status === "Incident"
        ? styles.chipRed
        : styles.chipBlue;

  const icon = status === "Livré" ? "✅" : status === "Incident" ? "⚠️" : "📦";
  return (
    <View style={[styles.chipBase, tone]}>
      <Text style={styles.chipText}>
        {icon} {status}
      </Text>
    </View>
  );
}

function Pill({ label, tone }: { label: string; tone: "purple" | "gray" }) {
  return (
    <View
      style={[
        styles.pillBase,
        tone === "purple" ? styles.pillPurple : styles.pillGray,
      ]}
    >
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0B1220",
  },

  header: {
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#0B1220",
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerKicker: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  headerBtn: {
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  headerBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  headerBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  progressCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 12,
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 8,
  },
  progressText: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    fontWeight: "700",
  },
  progressPct: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },
  progressBarBg: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#4F8CFF",
  },

  searchRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  clearBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 20,
    fontWeight: "900",
    marginTop: -2,
  },

  filtersRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  filterPillActive: {
    backgroundColor: "rgba(79,140,255,0.25)",
    borderColor: "rgba(79,140,255,0.60)",
  },
  filterPillPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  filterText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "800",
  },
  filterTextActive: {
    color: "white",
  },

  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: 12,
    marginTop: 12,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardBadgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  metaRight: {
    alignItems: "flex-end",
  },
  metaSmall: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "800",
  },
  metaBig: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  cardMainRow: {
    flexDirection: "row",
    gap: 12,
  },
  thumb: {
    width: 66,
    height: 66,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  cardBody: {
    flex: 1,
  },
  title: {
    color: "white",
    fontSize: 16,
    fontWeight: "900",
  },
  subtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  codeLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  codeValue: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 11,
    fontWeight: "900",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginHorizontal: 2,
  },
  noteText: {
    marginTop: 10,
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },

  cardActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  distancePill: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  distanceText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "800",
  },

  actionsRight: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  btnGhost: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  btnGhostText: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 12,
    fontWeight: "900",
  },
  btnPrimary: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#4F8CFF",
  },
  btnPrimaryText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  chipBase: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
  },
  chipGreen: {
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: "rgba(34,197,94,0.40)",
  },
  chipRed: {
    backgroundColor: "rgba(239,68,68,0.18)",
    borderColor: "rgba(239,68,68,0.40)",
  },
  chipBlue: {
    backgroundColor: "rgba(79,140,255,0.18)",
    borderColor: "rgba(79,140,255,0.40)",
  },

  pillBase: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    color: "white",
    fontSize: 11,
    fontWeight: "900",
  },
  pillPurple: {
    backgroundColor: "rgba(168,85,247,0.18)",
    borderColor: "rgba(168,85,247,0.40)",
  },
  pillGray: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.10)",
  },
});
