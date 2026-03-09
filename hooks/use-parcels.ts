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

import { MOCK_PARCELS } from "@/data/mock-parcels";
import { incidentService, preuveService } from "@/services";
import { getStoredParcels, setStoredParcels } from "@/storage/parcelsStorage";
import {
    getStoredSyncQueue,
    setStoredSyncQueue,
} from "@/storage/syncQueueStorage";
import type { TypeIncident } from "@/types";
import type { Parcel, ParcelStatus } from "@/types/parcel";

type SyncQueueItem =
  | {
      kind: "proof";
      parcelId: string;
      proof: Parcel["proof"];
    }
  | {
      kind: "incident";
      parcelId: string;
      incident: {
        type: TypeIncident;
        commentaire?: string;
        photoPreuveUrl?: string;
      };
    };

type UseParcelsValue = {
  parcels: Parcel[];
  isLoading: boolean;
  isSyncing: boolean;
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
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const isFlushingRef = useRef(false);

  const enqueueSync = useCallback(async (item: SyncQueueItem) => {
    setSyncQueue((current) => {
      const next = [...current, item];
      void setStoredSyncQueue(next);
      return next;
    });
  }, []);

  const flushSyncQueue = useCallback(async () => {
    if (isFlushingRef.current) {
      return;
    }

    isFlushingRef.current = true;
    setIsSyncing(true);

    try {
      let queue = [...syncQueue];
      if (queue.length === 0) {
        return;
      }

      const remaining: SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          if (item.kind === "proof") {
            if (!item.proof?.gps) {
              continue;
            }

            await preuveService.create({
              colisId: item.parcelId,
              horodatage: item.proof.timestamp ?? new Date().toISOString(),
              latValidation: item.proof.gps.lat,
              lngValidation: item.proof.gps.lng,
            });
            continue;
          }

          await incidentService.create({
            colisId: item.parcelId,
            type: item.incident.type,
            commentaire: item.incident.commentaire,
            photoPreuveUrl: item.incident.photoPreuveUrl,
            horodatage: new Date().toISOString(),
          });
        } catch {
          remaining.push(item);
        }
      }

      setSyncQueue(remaining);
      await setStoredSyncQueue(remaining);
    } finally {
      isFlushingRef.current = false;
      setIsSyncing(false);
    }
  }, [syncQueue]);

  const load = useCallback(async () => {
    const [storedParcels, storedQueue] = await Promise.all([
      getStoredParcels(),
      getStoredSyncQueue<SyncQueueItem>(),
    ]);

    setSyncQueue(storedQueue);

    const stored = storedParcels;
    if (stored && stored.length > 0) {
      setParcels(stored);
      return;
    }

    setParcels(MOCK_PARCELS);
    await setStoredParcels(MOCK_PARCELS);
  }, []);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  }, [load]);

  useEffect(() => {
    if (isLoading) return;
    void flushSyncQueue();
  }, [flushSyncQueue, isLoading]);

  const refresh = useCallback(async () => {
    await load();
    await flushSyncQueue();
  }, [flushSyncQueue, load]);

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
      await updateParcel(id, {
        status,
        proof,
      });

      if (proof?.gps) {
        await enqueueSync({
          kind: "proof",
          parcelId: id,
          proof,
        });
      }

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

      await enqueueSync({
        kind: "incident",
        parcelId: id,
        incident: {
          type,
          commentaire,
          photoPreuveUrl,
        },
      });

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
      pendingSyncCount: syncQueue.length,
      refresh,
      updateParcel,
      setStatusWithProof,
      markIncident,
      getById,
    }),
    [
      getById,
      isLoading,
      isSyncing,
      markIncident,
      parcels,
      refresh,
      setStatusWithProof,
      syncQueue.length,
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
