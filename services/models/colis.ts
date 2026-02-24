import { db } from "../config/db";

export interface Colis {
  id: string;
  tournee_id: string;
  destinataire_id: string;
  localisation_id: string;
  code_barre: string;
  statut: 'A_LIVRER' | 'EN_COURS_ACHEMINEMENT' | 'LIVRE' | 'ECHEC_LIVRAISON';
  instructions_livreur?: string;
}

export function insertColis(colis: Colis) {
  db.runSync(
    `
      INSERT OR REPLACE INTO colis (
        id,
        tournee_id,
        destinataire_id,
        localisation_id,
        code_barre,
        statut,
        instructions_livreur
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      colis.id,
      colis.tournee_id,
      colis.destinataire_id,
      colis.localisation_id,
      colis.code_barre,
      colis.statut,
      colis.instructions_livreur || null
    ]
  );
}

export function getColisByTournee(tourneeId: string): Colis[] {
  const results = db.getAllSync(
    `
      SELECT * FROM colis WHERE tournee_id = ?
    `,
    [tourneeId]
  );
  return results as Colis[];
}

export function getColisById(id: string): Colis | null {
  const result = db.getFirstSync<Colis>(
    `
      SELECT * FROM colis WHERE id = ?
    `,
    [id]
  );
  return result || null;
}

export function updateColisStatut(id: string, statut: Colis['statut']) {
  db.runSync(
    `
      UPDATE colis SET statut = ? WHERE id = ?
    `,
    [statut, id]
  );
}

export function deleteColis(id: string) {
  db.runSync(
    `
      DELETE FROM colis WHERE id = ?
    `,
    [id]
  );
}

export function getAllColis(): Colis[] {
  const results = db.getAllSync(
    `
      SELECT * FROM colis
    `
  );
  return results as Colis[];
}