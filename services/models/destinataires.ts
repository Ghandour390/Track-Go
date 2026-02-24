import { db } from "../config/db";

export interface Destinataire {
    id: string;
    nom: string;
    prenom: string;
    email: string;
    token_auth?: string;
}


export function insertDestinataire(destinataire: Destinataire) {
  db.runSync(
    `
      INSERT OR REPLACE INTO destinataires (
        id,
        nom,
        prenom,
        email,
        token_auth
      ) VALUES (?, ?, ?, ?, ?)
    `,
    [
      destinataire.id,
      destinataire.nom,
      destinataire.prenom,
      destinataire.email,
      destinataire.token_auth || null,
    ],
  );
}

export function getDestinataireByEmail(email: string): Destinataire | null {
  const result = db.getFirstSync<Destinataire>(
    `
      SELECT * FROM destinataires WHERE email = ?
    `,
    [email],
  );
  return result || null;
}


export function getDestinataireById(id: string): Destinataire | null {
  const result = db.getFirstSync<Destinataire>(
    `
      SELECT * FROM destinataires WHERE id = ?
    `,
    [id],
  );
  return result || null;
}

export function updateDestinataireToken(id: string, token: string) {
  db.runSync(
    `
      UPDATE destinataires SET token_auth = ? WHERE id = ?
    `,
    [token, id],
  );
}


