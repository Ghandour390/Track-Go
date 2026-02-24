// Typage strict d'un colis
export interface Parcel {
  id: string;
  recipient: string;
  address: string;
  status: 'PENDING' | 'DELIVERED' | 'INCIDENT';
  lat: number;
  lng: number;
}