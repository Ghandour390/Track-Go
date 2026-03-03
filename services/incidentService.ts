import type { Incident } from '../types';
import { api } from './api';

export const incidentService = {
  /** Récupère tous les incidents */
  getAll(): Promise<Incident[]> {
    return api.get<Incident[]>('/incidents').then((r) => r.data);
  },

  /** Récupère tous les incidents d'un colis */
  getByColis(colisId: string): Promise<Incident[]> {
    return api
      .get<Incident[]>('/incidents', { params: { colisId } })
      .then((r) => r.data);
  },

  /** Déclare un nouvel incident */
  create(incident: Omit<Incident, 'id'>): Promise<Incident> {
    return api.post<Incident>('/incidents', incident).then((r) => r.data);
  },

  /** Met à jour le type ou le commentaire d'un incident */
  update(
    id: string,
    data: Partial<Pick<Incident, 'type' | 'commentaire' | 'photoPreuveUrl'>>,
  ): Promise<Incident> {
    return api.patch<Incident>(`/incidents/${id}`, data).then((r) => r.data);
  },
};
