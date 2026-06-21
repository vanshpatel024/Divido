import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { supabaseAnon } from '../config/supabase';
import { supabaseAdmin } from '../config/supabase';
import { wsManager, ExtendedWs } from './wsManager';

const HEARTBEAT_INTERVAL_MS = 25_000;
const HEARTBEAT_TIMEOUT_MS  = 10_000;

/**
 * Validates a Supabase JWT and returns the userId, or null if invalid.
 */
async function verifyToken(token: string): Promise<string | null> {
  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser(token);
    if (error || !user) return null;
    return user.id;
  } catch {
    return null;
  }
}

/**
 * Checks whether userId is an active participant of the given tripId.
 */
async function isTripParticipant(tripId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('trip_participants')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', userId)
    .maybeSingle();
  return !error && !!data;
}

function send(ws: ExtendedWs, payload: object): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

/**
 * Attaches the WebSocket server to the existing HTTP server.
 * All WS traffic shares the same port as Express — no extra port needed.
 */
export function initWsServer(httpServer: Server): void {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // ── Heartbeat interval ────────────────────────────────────────────────────
  const heartbeatTimer = setInterval(() => {
    wss.clients.forEach((rawWs) => {
      const ws = rawWs as ExtendedWs;
      if (!ws.isAlive) {
        // No pong received in previous cycle — terminate stale connection
        wsManager.removeFromAllRooms(ws);
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, HEARTBEAT_INTERVAL_MS);

  wss.on('close', () => clearInterval(heartbeatTimer));

  // ── New connection ────────────────────────────────────────────────────────
  wss.on('connection', (rawWs: WebSocket, _req: IncomingMessage) => {
    const ws = rawWs as ExtendedWs;
    ws.isAlive = true;
    ws.rooms    = new Set();

    // Pong resets the liveness flag
    ws.on('pong', () => { ws.isAlive = true; });

    // Set a timeout: client MUST authenticate within 10 seconds
    let authTimeout: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      if (!ws.userId) {
        send(ws, { type: 'error', message: 'Authentication timeout' });
        ws.terminate();
      }
    }, HEARTBEAT_TIMEOUT_MS);

    // ── Message handler ───────────────────────────────────────────────────
    ws.on('message', async (raw) => {
      let msg: { type: string; token?: string; tripId?: string };

      try {
        msg = JSON.parse(raw.toString());
      } catch {
        send(ws, { type: 'error', message: 'Invalid JSON' });
        return;
      }

      // ── Step 1: auth ──────────────────────────────────────────────────
      if (msg.type === 'auth') {
        if (!msg.token) {
          send(ws, { type: 'error', message: 'Token required' });
          return;
        }

        const userId = await verifyToken(msg.token);
        if (!userId) {
          send(ws, { type: 'error', message: 'Invalid or expired token' });
          ws.terminate();
          return;
        }

        ws.userId = userId;
        if (authTimeout) {
          clearTimeout(authTimeout);
          authTimeout = null;
        }
        send(ws, { type: 'authenticated', userId });
        return;
      }

      // All subsequent messages require an authenticated userId
      if (!ws.userId) {
        send(ws, { type: 'error', message: 'Not authenticated' });
        return;
      }

      // ── Step 2: subscribe to a trip ───────────────────────────────────
      if (msg.type === 'subscribe') {
        if (!msg.tripId) {
          send(ws, { type: 'error', message: 'tripId required' });
          return;
        }

        // Verify the user is actually a participant before letting them in
        const allowed = await isTripParticipant(msg.tripId, ws.userId);
        if (!allowed) {
          send(ws, { type: 'error', message: 'Not a participant of this trip' });
          return;
        }

        wsManager.addToRoom(msg.tripId, ws);
        send(ws, { type: 'subscribed', tripId: msg.tripId });
        return;
      }

      // ── Step 3: unsubscribe ───────────────────────────────────────────
      if (msg.type === 'unsubscribe') {
        if (msg.tripId) {
          wsManager.removeFromRoom(msg.tripId, ws);
          send(ws, { type: 'unsubscribed', tripId: msg.tripId });
        }
        return;
      }

      // ── Step 4: subscribe to dashboard (user-scoped room) ────────────
      if (msg.type === 'subscribe_dashboard') {
        // Dashboard room key is prefixed to avoid collision with trip ids
        const dashRoomId = `dashboard:${ws.userId}`;
        wsManager.addToRoom(dashRoomId, ws);
        send(ws, { type: 'subscribed_dashboard' });
        return;
      }
    });

    // ── Cleanup on disconnect ─────────────────────────────────────────────
    ws.on('close', () => {
      if (authTimeout) clearTimeout(authTimeout);
      wsManager.removeFromAllRooms(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
      wsManager.removeFromAllRooms(ws);
    });
  });

  console.log('🔌 WebSocket server initialised on /ws');
}
