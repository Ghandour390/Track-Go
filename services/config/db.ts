import * as sqlite from 'expo-sqlite';

export const db = sqlite.openDatabaseSync('track-go.db');

const STATUT_COLIS = ['A_LIVRER', 'EN_COURS_ACHEMINEMENT', 'LIVRE', 'ECHEC_LIVRAISON'];
const STATUT_TOURNEE = ['PLANIFIEE', 'EN_COURS', 'TERMINEE'];
const TYPE_INCIDENT = ['CLIENT_ABSENT', 'COLIS_ENDOMMAGE', 'ADRESSE_INCORRECTE', 'AUTRE'];

function listToSql(values: readonly string[]) {
  return values.map((value) => `'${value}'`).join(', ');
}

export function initDatabase() {
  db.execSync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS livreurs (
      id TEXT PRIMARY KEY,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      token_auth TEXT
    );

    CREATE TABLE IF NOT EXISTS tournees (
      id TEXT PRIMARY KEY,
      livreur_id TEXT NOT NULL,
      date TEXT NOT NULL,
      statut TEXT NOT NULL CHECK (statut IN (${listToSql(STATUT_TOURNEE)})),
      distance_totale REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (livreur_id) REFERENCES livreurs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS destinataires (
      id TEXT PRIMARY KEY,
      nom_complet TEXT NOT NULL,
      telephone TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS localisations (
      id TEXT PRIMARY KEY,
      adresse_complete TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      code_postal TEXT
    );

    CREATE TABLE IF NOT EXISTS colis (
      id TEXT PRIMARY KEY,
      tournee_id TEXT NOT NULL,
      destinataire_id TEXT NOT NULL,
      localisation_id TEXT NOT NULL,
      code_barre TEXT NOT NULL UNIQUE,
      statut TEXT NOT NULL CHECK (statut IN (${listToSql(STATUT_COLIS)})),
      instructions_livreur TEXT,
      FOREIGN KEY (tournee_id) REFERENCES tournees(id) ON DELETE CASCADE,
      FOREIGN KEY (destinataire_id) REFERENCES destinataires(id) ON DELETE RESTRICT,
      FOREIGN KEY (localisation_id) REFERENCES localisations(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS preuves_livraison (
      id TEXT PRIMARY KEY,
      colis_id TEXT NOT NULL UNIQUE,
      horodatage TEXT NOT NULL,
      lat_validation REAL NOT NULL,
      lng_validation REAL NOT NULL,
      methode_verification_id TEXT,
      signature_client_url TEXT,
      FOREIGN KEY (colis_id) REFERENCES colis(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      colis_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN (${listToSql(TYPE_INCIDENT)})),
      commentaire TEXT,
      photo_preuve_url TEXT,
      horodatage TEXT NOT NULL,
      FOREIGN KEY (colis_id) REFERENCES colis(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tournees_livreur_id ON tournees(livreur_id);
    CREATE INDEX IF NOT EXISTS idx_colis_tournee_id ON colis(tournee_id);
    CREATE INDEX IF NOT EXISTS idx_colis_destinataire_id ON colis(destinataire_id);
    CREATE INDEX IF NOT EXISTS idx_colis_localisation_id ON colis(localisation_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_colis_id ON incidents(colis_id);
  `);
}

