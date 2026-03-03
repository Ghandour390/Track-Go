import type { Colis, StatutColis } from '../types';
import { api } from './api';

export const colisService = {
  /** Récupère tous les colis */
  getAll(): Promise<Colis[]> {
    return api.get<Colis[]>('/colis').then((r) => r.data);
  },

  /** Récupère un colis par son id */
  getById(id: string): Promise<Colis> {
    return api.get<Colis>(`/colis/${id}`).then((r) => r.data);
  },

  /** Récupère tous les colis d'une tournée */
  getByTournee(tourneeId: string): Promise<Colis[]> {
    return api
      .get<Colis[]>('/colis', { params: { tourneeId } })
      .then((r) => r.data);
  },

  /** Récupère un colis par son code-barre */
  getByCodeBarre(codeBarre: string): Promise<Colis | null> {
    return api
      .get<Colis[]>('/colis', { params: { codeBarre } })
      .then((r) => r.data[0] ?? null);
  },

  /** Crée un nouveau colis */
  create(colis: Omit<Colis, 'id'>): Promise<Colis> {
    return api.post<Colis>('/colis', colis).then((r) => r.data);
  },

  /** Met à jour le statut d'un colis */
  updateStatut(id: string, statut: StatutColis): Promise<Colis> {
    return api.patch<Colis>(`/colis/${id}`, { statut }).then((r) => r.data);
  },

  /** Met à jour partiellement un colis */
  update(id: string, data: Partial<Omit<Colis, 'id'>>): Promise<Colis> {
    return api.patch<Colis>(`/colis/${id}`, data).then((r) => r.data);
  },

  /** Supprime un colis */
  delete(id: string): Promise<void> {
    return api.delete(`/colis/${id}`).then(() => undefined);
  },
};
