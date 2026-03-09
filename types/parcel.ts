export type ParcelStatus = "À livrer" | "Livré" | "Incident";

export type ParcelProof = {
  gps?: { lat: number; lng: number; accuracyM: number };
  photoUrl?: string;
  timestamp?: string;
};

export type ParcelPriority = "Normal" | "Express";

export type Parcel = {
  id: string;
  trackingCode: string;
  recipientName: string;
  phone?: string;
  addressLine: string;
  city: string;
  eta: string;
  distanceKm: number;
  status: ParcelStatus;
  priority?: ParcelPriority;
  note?: string;
  photoUrl?: string;
  proof?: ParcelProof;
  location?: {
    lat: number;
    lng: number;
  };
};
