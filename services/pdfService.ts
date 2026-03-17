import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { Parcel } from "@/types/parcel";

async function toDataUrl(uri?: string): Promise<string | null> {
  if (!uri) return null;
  if (uri.startsWith("data:image")) return uri;

  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to convert image"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateAndShareDeliveryReceipt(
  parcel: Parcel,
  driverName: string,
): Promise<void> {
  const proofPhotoDataUrl = await toDataUrl(parcel.proof?.photoUrl);
  const signatureDataUrl = await toDataUrl(parcel.proof?.signatureDataUrl);

  const html = `
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; padding: 20px; color: #111827; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .muted { color: #6b7280; font-size: 12px; margin-bottom: 14px; }
        .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; margin-bottom: 12px; }
        .row { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .label { font-size: 12px; color: #6b7280; }
        .value { font-size: 13px; font-weight: 600; }
        .img { width: 100%; max-height: 240px; object-fit: cover; border-radius: 10px; border: 1px solid #e5e7eb; }
        .sig { width: 100%; max-height: 120px; object-fit: contain; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; }
      </style>
    </head>
    <body>
      <h1>Bon de livraison certifié</h1>
      <div class="muted">Track&Go • Horodatage: ${new Date().toLocaleString()}</div>

      <div class="card">
        <div class="row"><div><div class="label">Colis</div><div class="value">${parcel.id}</div></div><div><div class="label">Statut</div><div class="value">${parcel.status}</div></div></div>
        <div class="row"><div><div class="label">Code tracking</div><div class="value">${parcel.trackingCode}</div></div><div><div class="label">Livreur</div><div class="value">${driverName || "—"}</div></div></div>
        <div class="row"><div><div class="label">Destinataire</div><div class="value">${parcel.recipientName}</div></div><div><div class="label">Adresse</div><div class="value">${parcel.addressLine}, ${parcel.city}</div></div></div>
      </div>

      <div class="card">
        <div class="label">Preuve GPS</div>
        <div class="value">${parcel.proof?.gps ? `${parcel.proof.gps.lat.toFixed(6)}, ${parcel.proof.gps.lng.toFixed(6)} (±${parcel.proof.gps.accuracyM}m)` : "Non disponible"}</div>
      </div>

      <div class="card">
        <div class="label">Photo de preuve</div>
        ${proofPhotoDataUrl ? `<img class="img" src="${proofPhotoDataUrl}" />` : `<div class="value">Aucune photo disponible</div>`}
      </div>

      <div class="card">
        <div class="label">Signature client</div>
        ${signatureDataUrl ? `<img class="sig" src="${signatureDataUrl}" />` : `<div class="value">Signature non fournie</div>`}
      </div>
    </body>
  </html>
  `;

  const result = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.uri, {
      mimeType: "application/pdf",
      dialogTitle: `Bon livraison ${parcel.id}`,
    });
  }
}
