import "react-native-get-random-values";

import {
  createContext,
  createElement,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";

import { MOCK_PARCELS } from "@/data/mock-parcels";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { api, colisService, incidentService, preuveService } from "@/services";
import { getStoredParcels, setStoredParcels } from "@/storage/parcelsStorage";
import {
  getStoredSyncQueue,
  setStoredSyncQueue,
} from "@/storage/syncQueueStorage";
import type {
  Colis,
  Destinataire,
  Incident,
  Localisation,
  PreuveLivraison,
  StatutColis,
  TypeIncident,
} from "@/types";
import type { Parcel, ParcelStatus } from "@/types/parcel";

type SyncActionType = "VALIDATEDELIVERY" | "REPORTINCIDENT";
type SyncActionStatus = "PENDING" | "SYNCING";

type ValidateDeliveryPayload = {
  parcelId: string;
  status: StatutColis;
  proof?: Parcel["proof"];
};

type ReportIncidentPayload = {
  parcelId: string;
  status: StatutColis;
  incident: {
    type: TypeIncident;
    commentaire?: string;
    photoPreuveUrl?: string;
  };
};

type SyncPayload = ValidateDeliveryPayload | ReportIncidentPayload;

type SyncQueueItem = {
  id: string;
  actionType: SyncActionType;
  payload: SyncPayload;
  timestamp: number;
  status: SyncActionStatus;
};

const DEFAULT_PHOTO_URL =
  "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=60";

function toRemoteStatus(status: ParcelStatus): StatutColis {
  if (status === "Livré") return "LIVRE";
  if (status === "Incident") return "ECHEC_LIVRAISON";
  return "A_LIVRER";
}

function fromRemoteStatus(status: StatutColis): ParcelStatus {
  if (status === "LIVRE") return "Livré";
  if (status === "ECHEC_LIVRAISON") return "Incident";
  return "À livrer";
}

function toQueueItem(
  actionType: SyncActionType,
  payload: SyncPayload,
): SyncQueueItem {
  return {
    id: uuidv4(),
    actionType,
    payload,
    timestamp: Date.now(),
    status: "PENDING",
  };
}

function normalizeStoredQueue(rawQueue: unknown[]): SyncQueueItem[] {
  const normalized: SyncQueueItem[] = [];

  for (const raw of rawQueue) {
    if (!raw || typeof raw !== "object") continue;
    const value = raw as Record<string, unknown>;

    if (
      typeof value.id === "string" &&
      (value.actionType === "VALIDATEDELIVERY" ||
        value.actionType === "REPORTINCIDENT")
    ) {
      normalized.push({
        id: value.id,
        actionType: value.actionType,
        payload: value.payload as SyncPayload,
        timestamp:
          typeof value.timestamp === "number" ? value.timestamp : Date.now(),
        status: value.status === "SYNCING" ? "SYNCING" : "PENDING",
      });
      continue;
    }

    if (value.kind === "status") {
      normalized.push(
        toQueueItem("VALIDATEDELIVERY", {
          parcelId: String(value.parcelId ?? ""),
          status: (value.status as StatutColis) ?? "A_LIVRER",
        }),
      );
      continue;
    }

    if (value.kind === "proof") {
      normalized.push(
        toQueueItem("VALIDATEDELIVERY", {
          parcelId: String(value.parcelId ?? ""),
          status: "LIVRE",
          proof: value.proof as Parcel["proof"],
        }),
      );
      continue;
    }

    if (value.kind === "incident") {
      normalized.push(
        toQueueItem("REPORTINCIDENT", {
          parcelId: String(value.parcelId ?? ""),
          status: "ECHEC_LIVRAISON",
          incident: value.incident as ReportIncidentPayload["incident"],
        }),
      );
    }
  }

  return normalized.sort((a, b) => a.timestamp - b.timestamp);
}

async function fetchParcelsFromApi(): Promise<Parcel[]> {
  const [colis, destinataires, localisations, preuves, incidents] =
    await Promise.all([
      api.get<Colis[]>("/colis").then((response) => response.data),
      api
        .get<Destinataire[]>("/destinataires")
        .then((response) => response.data),
      api
        .get<Localisation[]>("/localisations")
        .then((response) => response.data),
      api.get<PreuveLivraison[]>("/preuves").then((response) => response.data),
      api.get<Incident[]>("/incidents").then((response) => response.data),
    ]);

  const destinatairesById = new Map(
    destinataires.map((item) => [item.id, item]),
  );
  const localisationsById = new Map(
    localisations.map((item) => [item.id, item]),
  );
  const preuvesByColisId = new Map(preuves.map((item) => [item.colisId, item]));
  const incidentByColisId = new Map(
    incidents
      .slice()
      .sort((a, b) => (a.horodatage > b.horodatage ? -1 : 1))
      .map((item) => [item.colisId, item]),
  );

  return colis.map((item, index) => {
    const destinataire = destinatairesById.get(item.destinataireId);
    const localisation = localisationsById.get(item.localisationId);
    const preuve = preuvesByColisId.get(item.id);
    const incident = incidentByColisId.get(item.id);

    const recipientName = destinataire?.nomComplet ?? item.destinataireId;
    const addressLine = localisation?.adresseComplete ?? "Adresse inconnue";
    const city = (localisation?.codePostal ?? "").trim() || "Ville inconnue";

    return {
      id: item.id,
      trackingCode: item.codeBarre,
      recipientName,
      addressLine,
      city,
      eta: "--:--",
      distanceKm: Number((1 + index * 0.8).toFixed(1)),
      status: fromRemoteStatus(item.statut),
      priority: "Normal",
      note: incident?.commentaire ?? item.instructionsLivreur,
      photoUrl: DEFAULT_PHOTO_URL,
      proof:
        preuve || incident
          ? {
              gps: preuve
                ? {
                    lat: preuve.latValidation,
                    lng: preuve.lngValidation,
                    accuracyM: 15,
                  }
                : undefined,
              photoUrl: incident?.photoPreuveUrl,
              signatureDataUrl: preuve?.signatureClientUrl,
              timestamp: preuve?.horodatage ?? incident?.horodatage,
            }
          : undefined,
      location: localisation
        ? {
            lat: localisation.latitude,
            lng: localisation.longitude,
          }
        : undefined,
    } satisfies Parcel;
  });
}

type UseParcelsValue = {
  parcels: Parcel[];
  isLoading: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  pendingSyncCount: number;
  refresh: () => Promise<void>;
  updateParcel: (id: string, update: Partial<Parcel>) => Promise<void>;
  setStatusWithProof: (
    id: string,
    status: ParcelStatus,
    proof?: Parcel["proof"],
  ) => Promise<void>;
  markIncident: (payload: {
    id: string;
    type: TypeIncident;
    commentaire?: string;
    photoPreuveUrl?: string;
    gps?: NonNullable<Parcel["proof"]>["gps"];
  }) => Promise<void>;
  getById: (id: string) => Parcel | undefined;
};

const ParcelsContext = createContext<UseParcelsValue | undefined>(undefined);

export function ParcelsProvider({ children }: PropsWithChildren) {
  const { isOnline } = useOnlineStatus();
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  const persistQueue = useCallback(async (queue: SyncQueueItem[]) => {
    setSyncQueue(queue);
    await setStoredSyncQueue(queue);
  }, []);

  const enqueueSync = useCallback(
    async (item: SyncQueueItem) => {
      const next = [...syncQueue, item].sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      await persistQueue(next);
    },
    [persistQueue, syncQueue],
  );

  const processQueueItem = useCallback(async (item: SyncQueueItem) => {
    if (item.actionType === "VALIDATEDELIVERY") {
      const payload = item.payload as ValidateDeliveryPayload;
      await colisService.updateStatut(payload.parcelId, payload.status);

      if (payload.proof?.gps) {
        await preuveService.create({
          colisId: payload.parcelId,
          horodatage: payload.proof.timestamp ?? new Date().toISOString(),
          latValidation: payload.proof.gps.lat,
          lngValidation: payload.proof.gps.lng,
          signatureClientUrl: payload.proof.signatureDataUrl,
        });
      }

      return;
    }

    const payload = item.payload as ReportIncidentPayload;
    await incidentService.create({
      colisId: payload.parcelId,
      type: payload.incident.type,
      commentaire: payload.incident.commentaire,
      photoPreuveUrl: payload.incident.photoPreuveUrl,
      horodatage: new Date().toISOString(),
    });
    await colisService.updateStatut(payload.parcelId, payload.status);
  }, []);

  const flushSyncQueue = useCallback(async () => {
    if (isFlushingRef.current || !isOnline) return;

    isFlushingRef.current = true;
    setIsSyncing(true);

    try {
      const queue = [...syncQueue].sort((a, b) => a.timestamp - b.timestamp);
      if (queue.length === 0) return;

      while (queue.length > 0) {
        queue[0] = { ...queue[0], status: "SYNCING" };
        await persistQueue([...queue]);

        try {
          await processQueueItem(queue[0]);
          queue.shift();
          await persistQueue([...queue]);
        } catch {
          queue[0] = { ...queue[0], status: "PENDING" };
          await persistQueue([...queue]);
          break;
        }
      }
    } finally {
      isFlushingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, persistQueue, processQueueItem, syncQueue]);

  const load = useCallback(async () => {
    const [storedParcels, rawQueue] = await Promise.all([
      getStoredParcels(),
      getStoredSyncQueue<unknown>(),
    ]);

    const normalizedQueue = normalizeStoredQueue(rawQueue);
    await persistQueue(normalizedQueue);

    if (storedParcels && storedParcels.length > 0) {
      setParcels(storedParcels);
    }

    if (isOnline) {
      try {
        const remoteParcels = await fetchParcelsFromApi();
        if (remoteParcels.length > 0) {
          setParcels(remoteParcels);
          await setStoredParcels(remoteParcels);
          return;
        }
      } catch {}
    }

    if (storedParcels && storedParcels.length > 0) {
      return;
    }

    setParcels(MOCK_PARCELS);
    await setStoredParcels(MOCK_PARCELS);
  }, [isOnline, persistQueue]);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, [load]);

  useEffect(() => {
    if (isLoading || !isOnline) return;
    void flushSyncQueue();
  }, [flushSyncQueue, isLoading, isOnline]);

  const refresh = useCallback(async () => {
    await load();
    if (isOnline) {
      await flushSyncQueue();
    }
  }, [flushSyncQueue, isOnline, load]);

  const updateParcel = useCallback(
    async (id: string, update: Partial<Parcel>) => {
      setParcels((current) => {
        const next = current.map((item) =>
          item.id === id ? { ...item, ...update } : item,
        );
        void setStoredParcels(next);
        return next;
      });
    },
    [],
  );

  const setStatusWithProof = useCallback(
    async (id: string, status: ParcelStatus, proof?: Parcel["proof"]) => {
      const remoteStatus = toRemoteStatus(status);

      await updateParcel(id, { status, proof });

      await enqueueSync(
        toQueueItem("VALIDATEDELIVERY", {
          parcelId: id,
          status: remoteStatus,
          proof,
        }),
      );

      void flushSyncQueue();
    },
    [enqueueSync, flushSyncQueue, updateParcel],
  );

  const markIncident = useCallback(
    async ({
      id,
      type,
      commentaire,
      photoPreuveUrl,
      gps,
    }: {
      id: string;
      type: TypeIncident;
      commentaire?: string;
      photoPreuveUrl?: string;
      gps?: NonNullable<Parcel["proof"]>["gps"];
    }) => {
      const timestamp = new Date().toISOString();
      await updateParcel(id, {
        status: "Incident",
        note: commentaire,
        proof: {
          gps,
          photoUrl: photoPreuveUrl,
          timestamp,
        },
      });

      await enqueueSync(
        toQueueItem("REPORTINCIDENT", {
          parcelId: id,
          status: "ECHEC_LIVRAISON",
          incident: {
            type,
            commentaire,
            photoPreuveUrl,
          },
        }),
      );

      void flushSyncQueue();
    },
    [enqueueSync, flushSyncQueue, updateParcel],
  );

  const byId = useMemo(() => {
    const map = new Map<string, Parcel>();
    for (const parcel of parcels) {
      map.set(parcel.id, parcel);
    }
    return map;
  }, [parcels]);

  const getById = useCallback(
    (id: string) => {
      return byId.get(id);
    },
    [byId],
  );

  const value = useMemo<UseParcelsValue>(
    () => ({
      parcels,
      isLoading,
      isSyncing,
      isOnline,
      pendingSyncCount: syncQueue.filter((item) => item.status === "PENDING")
        .length,
      refresh,
      updateParcel,
      setStatusWithProof,
      markIncident,
      getById,
    }),
    [
      getById,
      isLoading,
      isOnline,
      isSyncing,
      markIncident,
      parcels,
      refresh,
      setStatusWithProof,
      syncQueue,
      updateParcel,
    ],
  );

  return createElement(ParcelsContext.Provider, { value }, children);
}

export function useParcels() {
  const context = useContext(ParcelsContext);
  if (!context) {
    throw new Error("useParcels must be used inside ParcelsProvider");
  }

  return context;
}
