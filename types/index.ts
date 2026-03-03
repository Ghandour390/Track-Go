// ─── Enums ────────────────────────────────────────────────────────────────────

export type StatutColis =
  | 'A_LIVRER'
  | 'EN_COURS_ACHEMINEMENT'
  | 'LIVRE'
  | 'ECHEC_LIVRAISON';

export type StatutTournee = 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE';

export type TypeIncident =
  | 'CLIENT_ABSENT'
  | 'COLIS_ENDOMMAGE'
  | 'ADRESSE_INCORRECTE'
  | 'AUTRE';

// ─── Entités ──────────────────────────────────────────────────────────────────

export interface Livreur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  tokenAuth?: string;
}

export interface Destinataire {
  id: string;
  nomComplet: string;
  telephone: string;
}

export interface Localisation {
  id: string;
  adresseComplete: string;
  latitude: number;
  longitude: number;
  codePostal?: string;
}

export interface Tournee {
  id: string;
  livreurId: string;
  date: string; // ISO 8601
  statut: StatutTournee;
  distanceTotale: number;
}

export interface Colis {
  id: string;
  tourneeId: string;
  destinataireId: string;
  localisationId: string;
  codeBarre: string;
  statut: StatutColis;
  instructionsLivreur?: string;
}

export interface PreuveLivraison {
  id: string;
  colisId: string;
  horodatage: string; // ISO 8601
  latValidation: number;
  lngValidation: number;
  methodeVerificationId?: string;
  signatureClientUrl?: string;
}

export interface Incident {
  id: string;
  colisId: string;
  type: TypeIncident;
  commentaire?: string;
  photoPreuveUrl?: string;
  horodatage: string; // ISO 8601
}

// ─── Vues enrichies (joined) ──────────────────────────────────────────────────

/** Colis avec ses relations résolues, utilisé dans l'UI */
export interface ColisDetail extends Colis {
  destinataire: Destinataire;
  localisation: Localisation;
  preuve?: PreuveLivraison;
  incidents?: Incident[];
}

/** Tournée avec ses colis, utilisée dans l'UI */
export interface TourneeDetail extends Tournee {
  colis: ColisDetail[];
}