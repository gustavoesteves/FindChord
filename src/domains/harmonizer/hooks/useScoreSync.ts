import { useEffect, useState } from "react";
import { musescoreAdapter, type ConnectionStatus } from "../../../utils/musescoreAdapter";

export function useScoreSync() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = musescoreAdapter.subscribe((status) => {
      setConnectionStatus(status);
      if (status === "disconnected") setIsSyncing(false);
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const syncScore = async () => {
    setIsSyncing(true);
    await musescoreAdapter.requestScoreSync();
    setTimeout(() => setIsSyncing(false), 800);
  };

  return {
    connectionStatus,
    isSyncing,
    canSync: connectionStatus === "connected" && !isSyncing,
    syncScore
  };
}

