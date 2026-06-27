import { useEffect, useState } from "react";
import { musescoreAdapter, type ConnectionStatus } from "../../utils/musescoreAdapter";

export function useMuseScoreConnection() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");

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

  return {
    status,
    reconnect: () => musescoreAdapter.connect()
  };
}

