import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SignatureScreen from "react-native-signature-canvas";

import { useParcels } from "@/hooks/use-parcels";

export default function ParcelSignatureScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;
  const { getById, updateParcel } = useParcels();
  const parcel = id ? getById(id) : undefined;
  const signatureRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!id || !parcel) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Colis introuvable</Text>
      </View>
    );
  }

  const handleOK = async (signatureDataUrl: string) => {
    setIsSaving(true);
    await updateParcel(id, {
      proof: {
        ...parcel.proof,
        signatureDataUrl,
        timestamp: new Date().toISOString(),
      },
    });
    setIsSaving(false);
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signature client</Text>
      <Text style={styles.subtitle}>
        {parcel.id} • {parcel.recipientName}
      </Text>

      <View style={styles.padWrap}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleOK}
          onEmpty={() => undefined}
          descriptionText="Signez dans la zone"
          clearText="Effacer"
          confirmText="Enregistrer"
          webStyle={`
            .m-signature-pad--footer { box-shadow: none; border-top: 1px solid #e5e7eb; }
            .m-signature-pad { box-shadow: none; border: none; }
            body,html { background: #ffffff; }
          `}
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={() => signatureRef.current?.clearSignature()}
          style={({ pressed }) => [
            styles.secondaryBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.secondaryText}>Effacer</Text>
        </Pressable>

        <Pressable
          onPress={() => signatureRef.current?.readSignature()}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && styles.pressed,
          ]}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.primaryText}>Valider</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
    padding: 16,
    gap: 10,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  padWrap: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "white",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 12,
  },
  primaryText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 12,
  },
  secondaryText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B1220",
  },
  error: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
