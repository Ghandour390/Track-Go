# Track&Go

Application mobile React Native (Expo) pour la gestion du dernier kilomètre:

- authentification livreur,
- gestion de tournée,
- scan colis,
- preuve de livraison (GPS + photo),
- incidents avec photo/commentaire,
- carte interactive des destinations,
- persistance locale + synchronisation différée.
- verrouillage biométrique + PIN de secours.
- génération de bon de livraison PDF partageable.

## Stack technique

- Expo Router (navigation file-based)
- TypeScript strict
- `expo-camera`, `expo-location`, `expo-task-manager`, `expo-image-picker`
- `expo-local-authentication`, `expo-secure-store`
- `expo-print`, `expo-sharing`, `react-native-signature-canvas`
- `react-native-maps`
- `@react-native-community/netinfo`
- AsyncStorage (cache local + file de synchronisation)
- JSON-Server mock API via Docker

## Prérequis

- Node.js 18+
- npm
- Expo CLI (via `npx expo`)
- Docker + Docker Compose (pour l’API mock)

## Lancement rapide

1. Installer les dépendances:

```bash
npm install
```

2. Configurer l’URL API dans `.env`:

```env
EXPO_PUBLIC_API_URL=http://<IP-OU-HOST>:3009
```

3. Démarrer l’API mock:

```bash
cd mock-server
docker compose up --build
```

4. Démarrer l’app Expo (depuis la racine):

```bash
npx expo start
```

## CI

La CI GitHub Actions déclenchée sur Pull Request exécute:

- Type-check (`tsc --noEmit`)
- Lint (`eslint`)

Fichier: `.github/workflows/ci.yml`

## Fonctionnalités principales

- **US1 Auth & Session**: login, restauration session, logout
- **US2 Dashboard/Tournée**: stats de progression, liste optimisée FlatList
- **US3 Scan intelligent**: scan 1D/2D + torche + saisie manuelle
- **US4 Preuve de livraison**: capture GPS + photo au moment de la validation
- **US5 Incident**: type, commentaire, photo, géolocalisation
- **US6 Sync Offline**: queue persistante ordonnée (`id/actionType/status`) + retry auto au retour réseau
- **US7 Biométrie/PIN**: verrouillage auto au background + déverrouillage FaceID/TouchID + fallback PIN
- **US8 PDF**: signature client + photo de preuve injectées dans un bon PDF partageable

## Architecture données

- Source distante: JSON-Server (`mock-server/db.json`)
- État applicatif: `hooks/use-parcels.ts`
- Statut réseau: `hooks/use-online-status.ts`
- Persistance locale: `storage/parcelsStorage.ts`
- File de synchro offline: `storage/syncQueueStorage.ts`
- Sécurité session/PIN: `storage/authStorage.ts` (SecureStore)

Flux:

1. Chargement API au démarrage (fallback local en cas d’erreur)
2. Mise à jour locale immédiate
3. Synchronisation API immédiate ou en file d’attente

## Flux signature / PDF

1. Ouvrir le détail colis
2. Capturer la signature client
3. Valider la livraison (GPS + photo)
4. Générer / partager le PDF du bon de livraison

## Scripts utiles

```bash
npm run lint
npx tsc --noEmit
npm run qa:verify
npm run android
npm run ios
npm run web
```

## Recette finale terrain

- Checklist complète: `QA_CHECKLIST.md`
- Vérification automatique locale: `npm run qa:verify`
