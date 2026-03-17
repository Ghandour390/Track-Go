import React from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/hooks/use-auth";
import { useParcels } from "@/hooks/use-parcels";

export default function ProfilScreen() {
  const { user, signOut, hasPin, savePin } = useAuth();
  const { pendingSyncCount, isSyncing } = useParcels();
  const [pin, setPin] = React.useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil livreur</Text>

      <View style={styles.card}>
        <Row label="Nom" value={user?.nom ?? "—"} />
        <Row label="Email" value={user?.email ?? "—"} />
        <Row
          label="État sync"
          value={isSyncing ? "Synchronisation en cours" : "À jour"}
        />
        <Row label="Actions en attente" value={`${pendingSyncCount}`} />
      </View>

      <Pressable
        onPress={async () => {
          const trimmed = pin.trim();
          if (trimmed.length < 4) {
            Alert.alert(
              "PIN invalide",
              "Le PIN doit contenir au moins 4 chiffres.",
            );
            return;
          }
          await savePin(trimmed);
          setPin("");
          Alert.alert("PIN enregistré", "Le fallback PIN est actif.");
        }}
        style={({ pressed }) => [styles.pinBtn, pressed && styles.btnPressed]}
      >
        <Text style={styles.pinBtnText}>
          {hasPin ? "Mettre à jour PIN" : "Configurer PIN secours"}
        </Text>
      </Pressable>

      <TextInput
        style={styles.pinInput}
        value={pin}
        onChangeText={setPin}
        secureTextEntry
        keyboardType="number-pad"
        maxLength={8}
        placeholder={hasPin ? "Nouveau PIN" : "PIN (4+ chiffres)"}
        placeholderTextColor="rgba(255,255,255,0.42)"
      />

      <Pressable
        onPress={() => void signOut()}
        style={({ pressed }) => [
          styles.logoutBtn,
          pressed && styles.btnPressed,
        ]}
      >
        {isSyncing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.logoutText}>Se déconnecter</Text>
        )}
      </Pressable>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
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
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    padding: 12,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  label: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 13,
    fontWeight: "800",
    flex: 1,
  },
  value: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    flex: 2,
    textAlign: "right",
  },
  logoutBtn: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  pinInput: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "white",
    backgroundColor: "rgba(255,255,255,0.05)",
    fontSize: 14,
    fontWeight: "700",
  },
  pinBtn: {
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  pinBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
  logoutText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900",
  },
  btnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
});
