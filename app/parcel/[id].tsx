// Écran de détail d'un colis spécifique
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import { colisService } from '@/services';
import type { Colis, StatutColis } from '@/types';

const STATUT_LABELS: Record<StatutColis, string> = {
  A_LIVRER: 'À livrer',
  EN_COURS_ACHEMINEMENT: 'En cours',
  LIVRE: 'Livré',
  ECHEC_LIVRAISON: 'Échec',
};

const STATUT_COLORS: Record<StatutColis, string> = {
  A_LIVRER: '#F59E0B',
  EN_COURS_ACHEMINEMENT: '#3B82F6',
  LIVRE: '#10B981',
  ECHEC_LIVRAISON: '#EF4444',
};

export default function ParcelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [colis, setColis] = useState<Colis | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    colisService
      .getById(id)
      .then(setColis)
      .catch(() => Alert.alert('Erreur', 'Colis introuvable.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleMarquerLivre() {
    if (!colis) return;
    setUpdating(true);
    try {
      const updated = await colisService.updateStatut(colis.id, 'LIVRE');
      setColis(updated);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut.');
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!colis) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Colis introuvable.</Text>
      </View>
    );
  }

  const statutColor = STATUT_COLORS[colis.statut];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Colis {colis.id}</Text>
        <View style={[styles.badge, { backgroundColor: statutColor + '22' }]}>
          <Text style={[styles.badgeText, { color: statutColor }]}>
            {STATUT_LABELS[colis.statut]}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Row label="Code-barre" value={colis.codeBarre} />
        <Row label="Tournée" value={colis.tourneeId} />
        <Row label="Destinataire" value={colis.destinataireId} />
        <Row label="Localisation" value={colis.localisationId} />
        {colis.instructionsLivreur && (
          <Row label="Instructions" value={colis.instructionsLivreur} />
        )}
      </View>

      <View style={styles.actions}>
        {colis.statut !== 'LIVRE' && (
          <TouchableOpacity
            style={[styles.btn, styles.btnSuccess, updating && styles.btnDisabled]}
            onPress={handleMarquerLivre}
            disabled={updating}>
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Marquer comme livré</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.btn, styles.btnDanger]}
          onPress={() => router.push({ pathname: '/parcel/incident', params: { colisId: colis.id } })}>
          <Text style={styles.btnText}>Déclarer un incident</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 20, gap: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeText: { fontWeight: '600', fontSize: 13 },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0 1px 8px rgba(0,0,0,0.05)' },
      default: { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    }),
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rowLabel: { fontSize: 14, color: '#6B7280', flex: 1 },
  rowValue: { fontSize: 14, color: '#111827', fontWeight: '500', flex: 2, textAlign: 'right' },
  actions: { gap: 12 },
  btn: {
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  btnSuccess: { backgroundColor: '#10B981' },
  btnDanger: { backgroundColor: '#EF4444' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
