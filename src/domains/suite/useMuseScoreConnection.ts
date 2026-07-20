import { useEffect, useState } from "react";
import {
  musescoreAdapter,
  type BridgeOperationalStatus,
  type ConnectionStatus
} from "../../utils/musescoreAdapter";

export function useMuseScoreConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [operationalStatus, setOperationalStatus] = useState<BridgeOperationalStatus | null>(null);

  useEffect(() => {
    musescoreAdapter.connect();
    const unsubscribe = musescoreAdapter.subscribe((nextStatus) => {
      setStatus(nextStatus);
    });

    return () => {
      unsubscribe();
      musescoreAdapter.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const refresh = async () => {
      if (status !== "connected") {
        setOperationalStatus(null);
        return;
      }

      try {
        const nextStatus = await musescoreAdapter.getOperationalStatus();
        if (!cancelled) setOperationalStatus(nextStatus);
      } catch {
        if (!cancelled) setOperationalStatus(null);
      }
    };

    refresh();
    interval = setInterval(refresh, 3000);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [status]);

  return {
    status,
    operationalStatus,
    reconnect: () => musescoreAdapter.connect()
  };
}
