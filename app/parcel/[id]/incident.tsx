import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useParcels } from "@/hooks/use-parcels";
import type { TypeIncident } from "@/types";

const INCIDENT_TYPES: { value: TypeIncident; label: string }[] = [
  { value: "CLIENT_ABSENT", label: "Client absent" },
  { value: "COLIS_ENDOMMAGE", label: "Colis endommagé" },
  { value: "ADRESSE_INCORRECTE", label: "Adresse incorrecte" },
  { value: "AUTRE", label: "Autre" },
];

export default function ParcelIncidentScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : undefined;

  const { getById, isLoading, markIncident, pendingSyncCount, isSyncing } =
    useParcels();
  const parcel = id ? getById(id) : undefined;

  const [type, setType] = useState<TypeIncident>("CLIENT_ABSENT");
  const [commentaire, setCommentaire] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => !saving && !!parcel, [saving, parcel]);

  const onTakePhoto = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== "granted") {
      Alert.alert(
        "Permission refusée",
        "Autorise la caméra pour joindre une preuve photo.",
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.65,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const onSubmit = async () => {
    if (!parcel || !id) {
      Alert.alert("Erreur", "Colis introuvable.");
      return;
    }

    setSaving(true);

    let gps:
      | {
          lat: number;
          lng: number;
          accuracyM: number;
        }
      | undefined;

    try {
      const locationPermission =
        await Location.requestForegroundPermissionsAsync();
      if (locationPermission.status === "granted") {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        gps = {
          lat: current.coords.latitude,
          lng: current.coords.longitude,
          accuracyM: Math.max(1, Math.round(current.coords.accuracy ?? 0)),
        };
      }

      const trimmedComment = commentaire.trim();
      await markIncident({
        id,
        type,
        commentaire: trimmedComment || parcel.note,
        photoPreuveUrl: photoUri ?? undefined,
        gps,
      });

      Alert.alert("Incident enregistré", "Le colis a été marqué en incident.", [
        { text: "OK", onPress: () => router.replace(`/parcel/${id}/scan`) },
      ]);
    } catch {
      Alert.alert(
        "Erreur",
        "Impossible d’enregistrer l’incident pour le moment.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F8CFF" />
      </View>
    );
  }

  if (!parcel) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Colis introuvable</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Signaler un incident</Text>
        <Text style={styles.subtitle}>
          {parcel.id} • {parcel.recipientName}
        </Text>

        <Text style={styles.sectionLabel}>Type d’incident</Text>
        <View style={styles.typesWrap}>
          {INCIDENT_TYPES.map((item) => {
            const active = item.value === type;
            return (
              <Pressable
                key={item.value}
                onPress={() => setType(item.value)}
                style={({ pressed }) => [
                  styles.typeBtn,
                  active && styles.typeBtnActive,
                  pressed && styles.typeBtnPressed,
                ]}
              >
                <Text
                  style={[styles.typeText, active && styles.typeTextActive]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Commentaire</Text>
        <TextInput
          value={commentaire}
          onChangeText={setCommentaire}
          multiline
          numberOfLines={5}
          placeholder="Décris le contexte (optionnel)"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={styles.textArea}
        />

        <Text style={styles.sectionLabel}>Preuve photo</Text>
        <Pressable
          onPress={onTakePhoto}
          style={({ pressed }) => [
            styles.photoBtn,
            pressed && styles.typeBtnPressed,
          ]}
        >
          <Text style={styles.photoBtnText}>
            {photoUri ? "Reprendre la photo" : "Prendre une photo"}
          </Text>
        </Pressable>
        {photoUri ? <Text style={styles.photoPath}>Photo capturée</Text> : null}
        {pendingSyncCount > 0 ? (
          <Text style={styles.photoPath}>
            Synchronisation en attente: {pendingSyncCount} action(s)
          </Text>
        ) : null}
        {isSyncing ? (
          <Text style={styles.photoPath}>Synchronisation en cours…</Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && styles.typeBtnPressed,
            ]}
          >
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </Pressable>

          <Pressable
            onPress={onSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.submitBtn,
              !canSubmit && styles.submitBtnDisabled,
              pressed && styles.typeBtnPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Enregistrer</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
    gap: 12,
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
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  subtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: -4,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 8,
    textTransform: "uppercase",
  },
  typesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  typeBtnActive: {
    borderColor: "rgba(239,68,68,0.5)",
    backgroundColor: "rgba(239,68,68,0.18)",
  },
  typeBtnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  typeText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontWeight: "800",
  },
  typeTextActive: {
    color: "white",
  },
  textArea: {
    minHeight: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    textAlignVertical: "top",
  },
  photoBtn: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  photoBtnText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "900",
  },
  photoPath: {
    color: "rgba(255,255,255,0.70)",
    fontSize: 11,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: "rgba(255,255,255,0.90)",
    fontSize: 13,
    fontWeight: "900",
  },
  submitBtn: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#EF4444",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
});
