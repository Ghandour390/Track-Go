import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useParcels } from "@/hooks/use-parcels";

export default function ScanScreen() {
  const { parcels } = useParcels();
  const [permission, requestPermission] = useCameraPermissions();
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const scanLock = useRef(false);

  const byTrackingCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const parcel of parcels) {
      map.set(parcel.trackingCode.trim().toLowerCase(), parcel.id);
    }
    return map;
  }, [parcels]);

  const validateAndNavigate = (codeRaw: string) => {
    const normalized = codeRaw.trim().toLowerCase();
    if (!normalized) {
      return;
    }

    const parcelId = byTrackingCode.get(normalized);
    if (!parcelId) {
      Alert.alert("Code inconnu", "Aucun colis ne correspond à ce code.");
      return;
    }

    router.push(`/parcel/${parcelId}/scan`);
  };

  const onBarcodeScanned = ({ data }: { data: string }) => {
    if (scanLock.current || isBusy) return;

    scanLock.current = true;
    setIsBusy(true);

    try {
      validateAndNavigate(data);
    } finally {
      setTimeout(() => {
        scanLock.current = false;
        setIsBusy(false);
      }, 700);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" color="#4F8CFF" />
        </SafeAreaView>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.centered}>
          <Text style={styles.hint}>
            L’accès caméra est nécessaire pour scanner les colis.
          </Text>
          <Pressable style={styles.manualBtn} onPress={requestPermission}>
            <Text style={styles.manualBtnText}>Autoriser la caméra</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Scanner un colis</Text>
          <Text style={styles.subtitle}>
            Lecture 1D/2D avec validation immédiate
          </Text>
        </View>

        <View style={styles.scannerContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            enableTorch={isTorchOn}
            barcodeScannerSettings={{
              barcodeTypes: ["ean13", "ean8", "code128", "qr"],
            }}
            onBarcodeScanned={onBarcodeScanned}
          />
          <View style={styles.viewfinder} pointerEvents="none">
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.controlsRow}>
            <Pressable
              style={styles.manualBtn}
              onPress={() => setIsTorchOn((current) => !current)}
            >
              <IconSymbol
                name={isTorchOn ? "flashlight.on.fill" : "flashlight.off.fill"}
                size={18}
                color="white"
              />
              <Text style={styles.manualBtnText}>
                {isTorchOn ? "Lampe ON" : "Lampe OFF"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.manualInputWrap}>
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Saisie manuelle du code"
              placeholderTextColor="rgba(255,255,255,0.5)"
              style={styles.manualInput}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.goBtn}
              onPress={() => {
                validateAndNavigate(manualCode);
                setManualCode("");
              }}
            >
              <Text style={styles.goBtnText}>Valider</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Conseil faible luminosité: active la lampe puis approche le code à
            ~20cm.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "white",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
  },
  scannerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  camera: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 300,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111827",
  },
  viewfinder: {
    position: "absolute",
    width: "100%",
    aspectRatio: 1,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 24,
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    borderColor: "#4F8CFF",
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === "android" ? 100 : 80, // Espace pour la tab bar
    gap: 10,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  manualBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  manualBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  manualInputWrap: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    color: "white",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: "700",
  },
  goBtn: {
    backgroundColor: "#4F8CFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  goBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
  },
  hint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});
