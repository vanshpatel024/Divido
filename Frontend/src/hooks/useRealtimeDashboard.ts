import { useEffect, useRef } from 'react';

const WS_URL = 'ws://localhost:3000/ws';

function backoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30_000);
}

/**
 * useRealtimeDashboard — subscribes to dashboard-level events (trip list
 * changes, new invitations) and calls `onUpdate()` to trigger a refetch.
 *
 * The "dashboard" subscription uses a special room key `dashboard:<userId>`
 * so the backend can broadcast when any of that user's trips change.
 *
 * For now we use a general subscribe-and-refetch strategy: any mutation on
 * any of the user's trips triggers a full dashboard refetch. This keeps the
 * implementation simple and avoids complex diff logic.
 */
export function useRealtimeDashboard(
  token: string | null,
  userId: string | undefined,
  onUpdate: (type?: string, payload?: unknown) => void
): void {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const onUpdateRef = useRef(onUpdate);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!token || !userId || !mountedRef.current) return;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; payload?: any };

          if (msg.type === 'authenticated') {
            ws.send(JSON.stringify({ type: 'subscribe_dashboard', userId }));
            return;
          }

          if (msg.type === 'subscribed_dashboard') {
            // Reconnected/subscribed successfully — trigger a sync to catch any missed updates
            onUpdateRef.current('subscribed_dashboard');
            return;
          }

          if (
            msg.type === 'trip_created' ||
            msg.type === 'trip_ended' ||
            msg.type === 'stop_created' ||
            msg.type === 'participant_joined' ||
            msg.type === 'participant_left' ||
            msg.type === 'invitation_received' ||
            msg.type === 'invitation_response'
          ) {
            onUpdateRef.current(msg.type, msg.payload);
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        if (event.code === 1000) return;
        
        const delay = backoff(attemptRef.current++);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, delay);
      };

      ws.onerror = () => {};
    }

    connect();

    const handleOnline = () => {
      if (mountedRef.current && wsRef.current?.readyState !== WebSocket.OPEN && wsRef.current?.readyState !== WebSocket.CONNECTING) {
        attemptRef.current = 0;
        connect();
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close(1000, 'unmount');
        } else {
          ws.onopen = null;
          ws.close(1000, 'unmount');
        }
        wsRef.current = null;
      }
    };
  }, [token, userId]);
}
