import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ParcelsProvider } from "@/hooks/use-parcels";

function AppNavigator() {
  const { state, isLocked, hasPin, unlockWithBiometrics, unlockWithPin } =
    useAuth();
  const [pin, setPin] = useState("");

  if (state.isLoading) {
    return null;
  }

  if (state.userToken && isLocked) {
    return (
      <View style={styles.lockScreen}>
        <Text style={styles.lockTitle}>Track&Go verrouillé</Text>
        <Text style={styles.lockSubtitle}>
          Authentifie-toi pour protéger les données de livraison.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={async () => {
            const ok = await unlockWithBiometrics();
            if (!ok && !hasPin) {
              Alert.alert(
                "Déverrouillage",
                "Biométrie indisponible. Configure un PIN dans Profil.",
              );
            }
          }}
        >
          <Text style={styles.primaryText}>Déverrouiller (biométrie)</Text>
        </Pressable>

        {hasPin ? (
          <View style={styles.pinWrap}>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              placeholder="Code PIN"
              placeholderTextColor="rgba(255,255,255,0.45)"
            />
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
              onPress={async () => {
                const valid = await unlockWithPin(pin);
                if (!valid) {
                  Alert.alert("PIN invalide", "Le code saisi est incorrect.");
                }
                setPin("");
              }}
            >
              <Text style={styles.secondaryText}>Valider PIN</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ParcelsProvider>
        <AppNavigator />
      </ParcelsProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    backgroundColor: "#0B1220",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  lockTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  lockSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "700",
  },
  primaryButton: {
    borderRadius: 14,
    backgroundColor: "#2563EB",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  primaryText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
  pinWrap: {
    gap: 8,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: "white",
    backgroundColor: "rgba(255,255,255,0.05)",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    paddingVertical: 11,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  secondaryText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
