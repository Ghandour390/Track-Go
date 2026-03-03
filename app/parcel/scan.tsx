// US3 : Écran de la caméra pour le scan
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colisService } from '@/services';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const scanningRef = useRef(false);

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.permText}>L&apos;accès à la caméra est requis pour scanner les colis.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanningRef.current || scanned) return;
    scanningRef.current = true;
    setScanned(true);
    setLoading(true);

    try {
      const colis = await colisService.getByCodeBarre(data);
      if (colis) {
        router.push({ pathname: '/parcel/[id]', params: { id: colis.id } });
      } else {
        Alert.alert('Colis introuvable', `Aucun colis trouvé pour le code : ${data}`, [
          {
            text: 'Scanner à nouveau',
            onPress: () => {
              setScanned(false);
              scanningRef.current = false;
            },
          },
        ]);
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de rechercher le colis.', [
        {
          text: 'Réessayer',
          onPress: () => {
            setScanned(false);
            scanningRef.current = false;
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Viewfinder overlay */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.hint}>
              {scanned ? 'Traitement en cours…' : 'Pointez le code-barre vers le cadre'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const SCAN_SIZE = 260;
const CORNER = 22;
const BORDER = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F3F4F6',
    gap: 20,
  },
  permText: { fontSize: 15, color: '#374151', textAlign: 'center' },
  btn: { backgroundColor: '#2563EB', borderRadius: 10, padding: 14, paddingHorizontal: 28 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  overlay: { flex: 1 },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: SCAN_SIZE },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scanWindow: { width: SCAN_SIZE, height: SCAN_SIZE },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  hint: { color: '#fff', fontSize: 14, textAlign: 'center', paddingHorizontal: 16 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  tr: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  bl: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  br: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },
});
