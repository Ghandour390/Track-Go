import type { Livreur } from '../types';
import { api } from './api';

export const livreurService = {
  /** Récupère tous les livreurs */
  getAll(): Promise<Livreur[]> {
    return api.get<Livreur[]>('/livreurs').then((r) => r.data);
  },

  /** Récupère un livreur par son id */
  getById(id: string): Promise<Livreur> {
    return api.get<Livreur>(`/livreurs/${id}`).then((r) => r.data);
  },

  /**
   * Authentifie un livreur par email / mot de passe.
   * JSON-Server ne gère pas l'auth : on filtre par email côté client
   * et on compare le tokenAuth utilisé comme pseudo-mot de passe.
   */
  login(email: string, tokenAuth: string): Promise<Livreur | null> {
    return api
      .get<Livreur[]>('/livreurs', { params: { email, tokenAuth } })
      .then((r) => r.data[0] ?? null);
  },

  /** Crée un nouveau livreur */
  create(livreur: Omit<Livreur, 'id'>): Promise<Livreur> {
    return api.post<Livreur>('/livreurs', livreur).then((r) => r.data);
  },

  /** Met à jour le token d'authentification */
  updateToken(id: string, tokenAuth: string): Promise<Livreur> {
    return api
      .patch<Livreur>(`/livreurs/${id}`, { tokenAuth })
      .then((r) => r.data);
  },

  /** Met à jour partiellement un livreur */
  update(id: string, data: Partial<Omit<Livreur, 'id'>>): Promise<Livreur> {
    return api.patch<Livreur>(`/livreurs/${id}`, data).then((r) => r.data);
  },
};
