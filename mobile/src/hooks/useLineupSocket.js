import { useEffect, useRef } from "react";
import { lineupWsUrl } from "../api/lineup";

export function useLineupSocket(lineupId, onUpdate) {
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!lineupId) return undefined;

    let ws;
    let retryTimer;
    let closedByUs = false;

    const connect = async () => {
      const url = await lineupWsUrl(lineupId);
      if (closedByUs) return;
      ws = new WebSocket(url);
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
  }, [lineupId]);
}
