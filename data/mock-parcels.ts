import type { Parcel } from "@/types/parcel";

export const MOCK_PARCELS: Parcel[] = [
  {
    id: "PK-10231",
    trackingCode: "TG-AX9-22019",
    recipientName: "Sara El Amrani",
    phone: "+212 6 12 34 56 78",
    addressLine: "12 Rue Al Massira, Appt 3",
    city: "Casablanca",
    eta: "09:45",
    distanceKm: 1.2,
    status: "À livrer",
    priority: "Express",
    note: "Appeler avant d’arriver.",
    photoUrl:
      "https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=900&q=60",
    location: { lat: 33.5737, lng: -7.5896 },
  },
  {
    id: "PK-10232",
    trackingCode: "TG-QM2-11001",
    recipientName: "Youssef Benali",
    addressLine: "Boulevard Zerktouni, Immeuble 18",
    city: "Casablanca",
    eta: "10:20",
    distanceKm: 3.8,
    status: "À livrer",
    priority: "Normal",
    photoUrl:
      "https://images.unsplash.com/photo-1520975958225-43e6f49f49f5?auto=format&fit=crop&w=900&q=60",
    location: { lat: 33.5892, lng: -7.6114 },
  },
  {
    id: "PK-10233",
    trackingCode: "TG-LP4-88073",
    recipientName: "Khadija Aït Lahcen",
    addressLine: "Hay Hassani, Rue 7",
    city: "Casablanca",
    eta: "11:05",
    distanceKm: 6.1,
    status: "Incident",
    priority: "Normal",
    note: "Destinataire absent (à reprogrammer).",
    photoUrl:
      "https://images.unsplash.com/photo-1583225214464-9296029427aa?auto=format&fit=crop&w=900&q=60",
    proof: {
      gps: { lat: 33.5731, lng: -7.5898, accuracyM: 18 },
      photoUrl:
        "https://images.unsplash.com/photo-1558008258-3256797b43f3?auto=format&fit=crop&w=900&q=60",
      timestamp: "2026-02-24T11:12:00.000Z",
    },
    location: { lat: 33.5568, lng: -7.6574 },
  },
  {
    id: "PK-10234",
    trackingCode: "TG-ZZ1-90012",
    recipientName: "Omar Ziani",
    addressLine: "Quartier Gauthier, Rue Ibnou Rochd",
    city: "Casablanca",
    eta: "12:30",
    distanceKm: 8.9,
    status: "Livré",
    priority: "Express",
    note: "Remis à la réception.",
    photoUrl:
      "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=900&q=60",
    proof: {
      gps: { lat: 33.5902, lng: -7.6039, accuracyM: 12 },
      photoUrl:
        "https://images.unsplash.com/photo-1523419409543-a5e549c1faa9?auto=format&fit=crop&w=900&q=60",
      timestamp: "2026-02-24T12:42:10.000Z",
    },
    location: { lat: 33.5899, lng: -7.6321 },
  },
  {
    id: "PK-10235",
    trackingCode: "TG-HH7-32009",
    recipientName: "Imane Toumi",
    addressLine: "Maarif, Rue Socrate",
    city: "Casablanca",
    eta: "14:10",
    distanceKm: 11.3,
    status: "À livrer",
    priority: "Normal",
    photoUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=60",
    location: { lat: 33.5778, lng: -7.6331 },
  },
];
