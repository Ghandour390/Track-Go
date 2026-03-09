import type { StatutTournee, Tournee } from '../types';
import { api } from './api';

export const tourneeService = {
  /** Récupère toutes les tournées */
  getAll(): Promise<Tournee[]> {
    return api.get<Tournee[]>('/tournees').then((r) => r.data);
  },

  /** Récupère une tournée par son id */
  getById(id: string): Promise<Tournee> {
    return api.get<Tournee>(`/tournees/${id}`).then((r) => r.data);
  },

  /** Récupère toutes les tournées d'un livreur */
  getByLivreur(livreurId: string): Promise<Tournee[]> {
    return api
      .get<Tournee[]>('/tournees', { params: { livreurId } })
      .then((r) => r.data);
  },

  /** Crée une nouvelle tournée */
  create(tournee: Omit<Tournee, 'id'>): Promise<Tournee> {
    return api.post<Tournee>('/tournees', tournee).then((r) => r.data);
  },

  /** Met à jour le statut d'une tournée */
  updateStatut(id: string, statut: StatutTournee): Promise<Tournee> {
    return api
      .patch<Tournee>(`/tournees/${id}`, { statut })
      .then((r) => r.data);
  },

  /** Met à jour partiellement une tournée */
  update(
    id: string,
    data: Partial<Omit<Tournee, 'id'>>,
  ): Promise<Tournee> {
    return api.patch<Tournee>(`/tournees/${id}`, data).then((r) => r.data);
  },
};
