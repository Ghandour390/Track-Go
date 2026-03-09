import { db } from "../config/db";

export interface Livreur {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  token_auth?: string;
}

export function insertLivreur(livreur: Livreur) {
  db.runSync(
    `
      INSERT OR REPLACE INTO livreurs (
        id,
        nom,
        prenom,
        email,
        token_auth
      ) VALUES (?, ?, ?, ?, ?)
    `,
    [
      livreur.id,
      livreur.nom,
      livreur.prenom,
      livreur.email,
      livreur.token_auth || null,
    ],
  );
}

export function getLivreurByEmail(email: string): Livreur | null {
  const result = db.getFirstSync<Livreur>(
    `
      SELECT * FROM livreurs WHERE email = ?
    `,
    [email],
  );
  return result || null;
}

export function getLivreurById(id: string): Livreur | null {
  const result = db.getFirstSync<Livreur>(
    `
      SELECT * FROM livreurs WHERE id = ?
    `,
    [id],
  );
  return result || null;
}

export function updateLivreurToken(id: string, token: string) {
  db.runSync(
    `
      UPDATE livreurs SET token_auth = ? WHERE id = ?
    `,
    [token, id],
  );
}

export function deleteLivreur(id: string) {
  db.runSync(
    `
      DELETE FROM livreurs WHERE id = ?
    `,
    [id],
  );
}

export function getAllLivreurs(): Livreur[] {
  const results = db.getAllSync(
    `
      SELECT * FROM livreurs
    `,
  );
  return results as Livreur[];
}
