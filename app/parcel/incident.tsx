// US5 : Formulaire d'incident
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { incidentService } from '@/services';
import type { TypeIncident } from '@/types';

const TYPES: { value: TypeIncident; label: string }[] = [
  { value: 'CLIENT_ABSENT', label: 'Client absent' },
  { value: 'COLIS_ENDOMMAGE', label: 'Colis endommagé' },
  { value: 'ADRESSE_INCORRECTE', label: 'Adresse incorrecte' },
  { value: 'AUTRE', label: 'Autre' },
];

export default function IncidentScreen() {
  const { colisId } = useLocalSearchParams<{ colisId: string }>();
  const [type, setType] = useState<TypeIncident>('CLIENT_ABSENT');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!colisId) {
      Alert.alert('Erreur', 'Identifiant du colis manquant.');
      return;
    }
    setLoading(true);
    try {
      await incidentService.create({
        colisId,
        type,
        commentaire: commentaire.trim() || undefined,
        photoPreuveUrl: undefined,
        horodatage: new Date().toISOString(),
      });
      Alert.alert('Incident déclaré', 'L\'incident a bien été enregistré.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'enregistrer l\'incident.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Déclarer un incident</Text>
        {colisId && <Text style={styles.subtitle}>Colis : {colisId}</Text>}

        <Text style={styles.label}>Type d&apos;incident</Text>
        <View style={styles.typeGrid}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeBtn, type === t.value && styles.typeBtnActive]}
              onPress={() => setType(t.value)}>
              <Text
                style={[
                  styles.typeBtnText,
                  type === t.value && styles.typeBtnTextActive,
                ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Commentaire</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Décrivez l'incident (optionnel)…"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          value={commentaire}
          onChangeText={setCommentaire}
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Envoyer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: -8 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeBtn: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  typeBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  typeBtnText: { fontSize: 14, color: '#374151' },
  typeBtnTextActive: { color: '#2563EB', fontWeight: '600' },
  textarea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    minHeight: 110,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
