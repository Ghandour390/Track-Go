import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useParcels } from "@/hooks/use-parcels";
import type { ParcelStatus } from "@/types/parcel";

function formatDateTime(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  // affichage simple (local)
  return `${d.toLocaleDateString()} • ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function clampText(s: string, max = 70) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

export default function ParcelDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;

  const { getById, isLoading, setStatusWithProof } = useParcels();
  const parcel = id ? getById(id) : undefined;

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorWrap}>
          <ActivityIndicator size="large" color="#4F8CFF" />
        </View>
      </View>
    );
  }

  if (!id || !parcel) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.errorWrap}>
          <Text style={styles.errorTitle}>Colis introuvable</Text>
          <Text style={styles.errorText}>
            Impossible de charger les détails. Vérifie l’ID dans l’URL ou
            reviens à la tournée.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.btnPrimaryText}>Retour</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const status: ParcelStatus = parcel.status;

  const onScan = () => {
    router.push("/parcel/scan");
  };

  const onIncident = () => {
    // Route recommandée : /parcels/:id/incident
    router.push(`/parcel/${parcel.id}/incident`);
  };

  const onCaptureProof = () => {
    Alert.alert(
      "Validation livraison",
      "Capturer la position GPS et marquer ce colis comme livré ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Valider",
          onPress: async () => {
            const permission =
              await Location.requestForegroundPermissionsAsync();
            if (permission.status !== "granted") {
              Alert.alert(
                "Permission refusée",
                "Active la localisation pour certifier la livraison.",
              );
              return;
            }

            try {
              const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });

              await setStatusWithProof(parcel.id, "Livré", {
                gps: {
                  lat: currentLocation.coords.latitude,
                  lng: currentLocation.coords.longitude,
                  accuracyM: Math.max(
                    1,
                    Math.round(currentLocation.coords.accuracy ?? 0),
                  ),
                },
                timestamp: new Date().toISOString(),
                photoUrl: parcel.proof?.photoUrl,
              });
            } catch {
              Alert.alert(
                "GPS indisponible",
                "Impossible de capturer la position actuelle.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && styles.btnPressed,
            ]}
          >
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>

          <View style={styles.topBarTitleWrap}>
            <Text style={styles.kicker}>Détail colis</Text>
            <Text style={styles.title}>{parcel.id}</Text>
          </View>

          <View style={styles.topRight}>
            <StatusChip status={status} />
          </View>
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Image source={{ uri: parcel.photoUrl }} style={styles.heroImage} />
          <View style={styles.heroBody}>
            <View style={styles.badgeRow}>
              {parcel.priority === "Express" ? (
                <Pill label="Express" tone="purple" />
              ) : (
                <Pill label="Normal" tone="gray" />
              )}
              <View style={styles.heroMeta}>
                <Text style={styles.metaSmall}>ETA</Text>
                <Text style={styles.metaBig}>{parcel.eta}</Text>
              </View>
            </View>

            <Text style={styles.recipient}>{parcel.recipientName}</Text>
            <Text style={styles.address}>
              {clampText(parcel.addressLine)} • {parcel.city}
            </Text>

            <View style={styles.rowInfo}>
              <InfoPill label={`📍 ${parcel.distanceKm.toFixed(1)} km`} />
              <InfoPill label={`🔎 ${parcel.trackingCode}`} />
            </View>

            {!!parcel.note && <Text style={styles.note}>📝 {parcel.note}</Text>}

            <View style={styles.heroActions}>
              <Pressable
                onPress={onIncident}
                style={({ pressed }) => [
                  styles.btnGhost,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.btnGhostText}>Incident</Text>
              </Pressable>

              <Pressable
                onPress={onScan}
                style={({ pressed }) => [
                  styles.btnPrimary,
                  pressed && styles.btnPressed,
                ]}
              >
                <Text style={styles.btnPrimaryText}>Scanner</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Section: Destinataire */}
        <Section title="Destinataire">
          <View style={styles.card}>
            <Row label="Nom" value={parcel.recipientName} />
            <Row label="Téléphone" value={parcel.phone ?? "—"} />
            <Row
              label="Adresse"
              value={`${parcel.addressLine}, ${parcel.city}`}
            />
          </View>
        </Section>

        {/* Section: Preuve de livraison */}
        <Section title="Preuve de livraison">
          <View style={styles.card}>
            <View style={styles.proofHeader}>
              <Text style={styles.proofHint}>
                {status === "Livré"
                  ? "Preuve enregistrée"
                  : status === "Incident"
                    ? "Preuve liée à un incident"
                    : "Aucune preuve — valider via scan"}
              </Text>

              <Pressable
                onPress={onCaptureProof}
                style={({ pressed }) => [
                  styles.smallBtn,
                  pressed && styles.smallBtnPressed,
                ]}
              >
                <Text style={styles.smallBtnText}>Capturer GPS</Text>
              </Pressable>
            </View>

            <View style={styles.proofGrid}>
              <View style={styles.proofTile}>
                <Text style={styles.tileLabel}>📍 GPS</Text>
                <Text style={styles.tileValue}>
                  {parcel.proof?.gps
                    ? `${parcel.proof.gps.lat.toFixed(4)}, ${parcel.proof.gps.lng.toFixed(4)}`
                    : "—"}
                </Text>
                <Text style={styles.tileSub}>
                  {parcel.proof?.gps
                    ? `Précision: ±${parcel.proof.gps.accuracyM}m`
                    : "Non capturé"}
                </Text>
              </View>

              <View style={styles.proofTile}>
                <Text style={styles.tileLabel}>🕒 Horodatage</Text>
                <Text style={styles.tileValue}>
                  {formatDateTime(parcel.proof?.timestamp)}
                </Text>
                <Text style={styles.tileSub}>Dernière mise à jour</Text>
              </View>
            </View>

            <View style={styles.proofPhotoWrap}>
              <Text style={styles.tileLabel}>📷 Photo</Text>
              {parcel.proof?.photoUrl ? (
                <Image
                  source={{ uri: parcel.proof.photoUrl }}
                  style={styles.proofPhoto}
                />
              ) : (
                <View style={styles.proofPhotoEmpty}>
                  <Text style={styles.proofEmptyText}>
                    Aucune photo enregistrée
                  </Text>
                  <Text style={styles.proofEmptySub}>
                    Après scan / incident, une photo peut être ajoutée.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Section>

        {/* Section: Actions rapides */}
        <Section title="Actions rapides">
          <View style={styles.quickGrid}>
            <QuickAction
              emoji="🧭"
              title="Ouvrir carte"
              subtitle="Voir la destination"
              onPress={() => router.push("../../../(tabs)/carte")}
            />
            <QuickAction
              emoji="📞"
              title="Appeler"
              subtitle="Contacter le client"
              onPress={() =>
                Alert.alert(
                  "Appel",
                  'Ici tu peux intégrer Linking.openURL("tel:...")',
                )
              }
            />
            <QuickAction
              emoji="🧾"
              title="Historique"
              subtitle="Événements du colis"
              onPress={() =>
                Alert.alert("Historique", "Option bonus : timeline / logs")
              }
            />
          </View>
        </Section>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function InfoPill({ label }: { label: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillText}>{label}</Text>
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

function QuickAction({
  emoji,
  title,
  subtitle,
  onPress,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickCard,
        pressed && styles.quickCardPressed,
      ]}
    >
      <Text style={styles.quickEmoji}>{emoji}</Text>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSub}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1220" },
  content: { padding: 16, paddingBottom: 28 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 18,
    fontWeight: "900",
    marginTop: -1,
  },
  topBarTitleWrap: { flex: 1 },
  kicker: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  title: { color: "white", fontSize: 22, fontWeight: "900", marginTop: 3 },
  topRight: { alignItems: "flex-end" },

  heroCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 22,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: 170,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  heroBody: { padding: 12 },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },
  heroMeta: { alignItems: "flex-end" },
  metaSmall: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "800",
  },
  metaBig: { color: "white", fontSize: 16, fontWeight: "900", marginTop: 2 },

  recipient: { color: "white", fontSize: 18, fontWeight: "900", marginTop: 2 },
  address: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    lineHeight: 16,
  },
  rowInfo: { flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 12 },
  note: {
    marginTop: 10,
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 16,
  },

  heroActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
  },
  btnGhostText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    fontWeight: "900",
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "#4F8CFF",
    alignItems: "center",
  },
  btnPrimaryText: { color: "white", fontSize: 13, fontWeight: "900" },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  section: { marginTop: 18 },
  sectionTitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  rowLabel: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 12,
    fontWeight: "800",
  },
  rowValue: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
    textAlign: "right",
  },

  proofHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  proofHint: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  smallBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  smallBtnText: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 12,
    fontWeight: "900",
  },

  proofGrid: {
    flexDirection: "row",
    gap: 12,
  },
  proofTile: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 12,
  },
  tileLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "900",
  },
  tileValue: { color: "white", fontSize: 13, fontWeight: "900", marginTop: 8 },
  tileSub: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 6,
  },

  proofPhotoWrap: { marginTop: 12 },
  proofPhoto: {
    width: "100%",
    height: 190,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 10,
  },
  proofPhotoEmpty: {
    marginTop: 10,
    height: 190,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  proofEmptyText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "900",
  },
  proofEmptySub: {
    color: "rgba(255,255,255,0.60)",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 6,
    textAlign: "center",
  },

  quickGrid: { flexDirection: "row", gap: 12 },
  quickCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 20,
    padding: 12,
  },
  quickCardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  quickEmoji: { fontSize: 18 },
  quickTitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 10,
  },
  quickSub: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 4,
  },

  chipBase: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { color: "white", fontSize: 11, fontWeight: "900" },
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
  pillText: { color: "white", fontSize: 11, fontWeight: "900" },
  pillPurple: {
    backgroundColor: "rgba(168,85,247,0.18)",
    borderColor: "rgba(168,85,247,0.40)",
  },
  pillGray: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.10)",
  },

  infoPill: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 999,
  },
  infoPillText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontWeight: "800",
  },

  errorWrap: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: { color: "white", fontSize: 20, fontWeight: "900" },
  errorText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 14,
    lineHeight: 16,
  },
});
