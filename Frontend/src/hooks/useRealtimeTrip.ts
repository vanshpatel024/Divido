import { useEffect, useRef } from "react";

const WS_URL = "ws://localhost:3000/ws";

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
  currentUserId: string | undefined,
  onUpdate: () => void,
  onNotification?: (type: "joined" | "left", userName: string) => void,
): void {
  const wsRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const onUpdateRef = useRef(onUpdate);
  const onNotificationRef = useRef(onNotification);
  const currentUserIdRef = useRef(currentUserId);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!tripId || !token || !mountedRef.current) return;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        ws.send(JSON.stringify({ type: "auth", token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as {
            type: string;
            userId?: string;
            tripId?: string;
            payload?: {
              userName?: string;
              tripId?: string;
              tripName?: string;
              actorId?: string;
              editorName?: string;
              oldTotal?: number;
              newTotal?: number;
            };
          };

          if (msg.type === "authenticated") {
            ws.send(JSON.stringify({ type: "subscribe", tripId }));
            return;
          }

          if (msg.type === "subscribed") {
            onUpdateRef.current();
            return;
          }

          if (
            msg.type === "stop_created" ||
            msg.type === "trip_ended" ||
            msg.type === "participant_joined" ||
            msg.type === "participant_left" ||
            msg.type === "invitations_changed" ||
            msg.type === "stop_updated" ||
            msg.type === "stop_deleted"
          ) {
            onUpdateRef.current();
            window.dispatchEvent(new CustomEvent("divido_trip_update"));

            const isOwnAction =
              msg.payload?.actorId &&
              currentUserIdRef.current &&
              msg.payload.actorId === currentUserIdRef.current;

            if (
              !isOwnAction &&
              msg.type === "participant_joined" &&
              onNotificationRef.current
            ) {
              onNotificationRef.current(
                "joined",
                msg.payload?.userName || "A participant",
              );
            } else if (
              !isOwnAction &&
              msg.type === "participant_left" &&
              onNotificationRef.current
            ) {
              onNotificationRef.current(
                "left",
                msg.payload?.userName || "A participant",
              );
            }
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
      if (
        mountedRef.current &&
        wsRef.current?.readyState !== WebSocket.OPEN &&
        wsRef.current?.readyState !== WebSocket.CONNECTING
      ) {
        attemptRef.current = 0;
        connect();
      }
    };
    window.addEventListener("online", handleOnline);

    return () => {
      mountedRef.current = false;
      window.removeEventListener("online", handleOnline);
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
          ws.onopen = () => ws.close(1000, "unmount");
        } else {
          ws.onopen = null;
          ws.close(1000, "unmount");
        }
        wsRef.current = null;
      }
    };
  }, [tripId, token]);
}
