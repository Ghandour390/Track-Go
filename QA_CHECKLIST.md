# Track&Go QA Checklist (US1-US8)

## 0) Préparation

- Démarrer API mock: `cd mock-server && docker compose up --build`
- Démarrer app: `npx expo start`
- Vérification auto: `npm run qa:verify`

## 1) Auth & Session

- [ ] Login valide redirige vers tabs.
- [ ] Relance app conserve session.
- [ ] Logout vide session et redirige login.

## 2) Offline Queue (US6)

- [ ] Désactiver réseau (mode avion).
- [ ] Valider 2 colis + déclarer 1 incident.
- [ ] Vérifier badge cloud: hors ligne + actions en attente > 0.
- [ ] Fermer/relancer app: actions toujours en attente.
- [ ] Réactiver réseau: queue passe progressivement en syncing puis 0 pending.
- [ ] Vérifier ordre d’exécution sur API (timestamps croissants).

## 3) Crash During Sync (US6 stress)

- [ ] Créer 3 actions offline.
- [ ] Réactiver réseau.
- [ ] Forcer fermeture app pendant syncing.
- [ ] Relancer app: reprise de la queue sans perte, sans doublon bloquant.

## 4) Biométrie + PIN (US7)

- [ ] Configurer PIN dans Profil.
- [ ] Mettre app en background puis revenir: écran verrouillage affiché.
- [ ] Déverrouiller par biométrie (si dispo).
- [ ] Désactiver biométrie / échec biométrie: fallback PIN fonctionne.

## 5) Proof & Incident (US4/US5)

- [ ] Validation livraison exige GPS + photo.
- [ ] Incident enregistre type/commentaire/photo (+ GPS si disponible).
- [ ] Statut local se met à jour immédiatement.

## 6) Signature + PDF (US8)

- [ ] Capturer signature client.
- [ ] Générer PDF depuis détail colis.
- [ ] PDF contient: ID colis, destinataire, GPS, photo preuve, signature, horodatage.
- [ ] Partage PDF fonctionne (`expo-sharing`).

## 7) Performance Smoke

- [ ] Scroll liste tournée fluide (FlatList optimisée).
- [ ] Pull-to-refresh ne duplique pas les items.
- [ ] Ouverture carte/scan/detail reste réactive.

## 8) Validation finale

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run qa:verify`
