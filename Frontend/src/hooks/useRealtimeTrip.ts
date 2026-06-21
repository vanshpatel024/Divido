import { useEffect, useRef, useCallback } from 'react';

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
  const wsRef        = useRef<WebSocket | null>(null);
  const attemptRef   = useRef(0);
  const mountedRef   = useRef(true);
  const onUpdateRef  = useRef(onUpdate);

  // Keep the callback ref fresh without re-triggering the effect
  onUpdateRef.current = onUpdate;

  const connect = useCallback(() => {
    if (!tripId || !token || !mountedRef.current) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0; // reset backoff on success
      // Step 1: authenticate (token in message body — never in URL)
      ws.send(JSON.stringify({ type: 'auth', token }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as { type: string; userId?: string; tripId?: string };

        if (msg.type === 'authenticated') {
          // Step 2: subscribe to this trip's room
          ws.send(JSON.stringify({ type: 'subscribe', tripId }));
          return;
        }

        // Any of these events means trip data has changed — refetch
        if (
          msg.type === 'stop_created'     ||
          msg.type === 'trip_ended'       ||
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
      // Don't reconnect if closed cleanly on unmount (code 1000)
      if (event.code === 1000) return;

      const delay = backoff(attemptRef.current++);
      setTimeout(() => {
        if (mountedRef.current) connect();
      }, delay);
    };

    ws.onerror = () => {
      // onclose fires immediately after onerror — reconnect handled there
    };
  }, [tripId, token]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close(1000, 'unmount');
        wsRef.current = null;
      }
    };
  }, [connect]);
}
