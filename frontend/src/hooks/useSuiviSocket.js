import { useEffect, useRef } from "react";
import { suiviWsUrl } from "../api/suivi";

export function useSuiviSocket(suiviId, onUpdate) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!suiviId) return undefined;

    let ws;
    let retryTimer;
    let closedByUs = false;

    const connect = () => {
      ws = new WebSocket(suiviWsUrl(suiviId));
      ws.onmessage = () => {
        onUpdateRef.current?.();
      };
      ws.onclose = () => {
        if (!closedByUs) {
          retryTimer = setTimeout(connect, 3000);
        }
      };
      ws.onerror = () => {
        ws.close();
      };
    };

    connect();

    return () => {
      closedByUs = true;
      clearTimeout(retryTimer);
      ws?.close();
    };
  }, [suiviId]);
}
