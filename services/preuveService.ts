import type { PreuveLivraison } from '../types';
import { api } from './api';

export const preuveService = {
  /** Récupère la preuve d'un colis (relation 0..1) */
  getByColis(colisId: string): Promise<PreuveLivraison | null> {
    return api
      .get<PreuveLivraison[]>('/preuves', { params: { colisId } })
      .then((r) => r.data[0] ?? null);
  },

  /** Enregistre la preuve de livraison */
  create(preuve: Omit<PreuveLivraison, 'id'>): Promise<PreuveLivraison> {
    return api
      .post<PreuveLivraison>('/preuves', preuve)
      .then((r) => r.data);
  },
};
