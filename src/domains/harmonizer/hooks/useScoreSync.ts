import { useEffect, useState } from "react";
import { musescoreAdapter, type ConnectionStatus } from "../../../utils/musescoreAdapter";

export function useScoreSync() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = musescoreAdapter.subscribe((status) => {
      setConnectionStatus(status);
      if (status === "disconnected") {
        setIsSyncing(false);
        setSyncError("Bridge local desconectado.");
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const syncScore = async () => {
    setIsSyncing(true);
    setSyncError(null);
    const success = await musescoreAdapter.requestScoreSync();
    setIsSyncing(false);
    if (!success) {
      setSyncError("Não recebi resposta do plugin do MuseScore. Verifique se o plugin está aberto na partitura correta.");
    }
    return success;
  };

  return {
    connectionStatus,
    isSyncing,
    syncError,
    canSync: connectionStatus === "connected" && !isSyncing,
    syncScore
  };
}
