import { useEffect, useRef } from 'react';

const WS_URL = 'ws://localhost:3000/ws';

// Exponential backoff: 1s, 2s, 4s, 8s … capped at 30s
function backoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30_000);
}

/**
 * useRealtimeTrip — opens a WebSocket connection and subscribes to real-time
 * events for the given tripId. Calls `onUpdate()` whenever the trip data
 * changes so the caller can refetch.
 *
 * Auth is done via first-message handshake: token is sent inside the WS
 * payload, never in the URL.
 */
export function useRealtimeTrip(
  tripId: string | undefined,
  token: string | null,
  onUpdate: () => void
): void {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!tripId || !token || !mountedRef.current) return;

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; userId?: string; tripId?: string };

          if (msg.type === 'authenticated') {
            ws.send(JSON.stringify({ type: 'subscribe', tripId }));
            return;
          }

          if (
            msg.type === 'stop_created' ||
            msg.type === 'trip_ended' ||
            msg.type === 'participant_joined'
          ) {
            onUpdateRef.current();
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        if (event.code === 1000) return;
        
        const delay = backoff(attemptRef.current++);
        setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      };

      ws.onerror = () => {};
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close(1000, 'unmount');
        wsRef.current = null;
      }
    };
  }, [tripId, token]);
}
