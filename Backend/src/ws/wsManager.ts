import { WebSocket } from 'ws';

interface ExtendedWs extends WebSocket {
  userId?: string;
  rooms?: Set<string>;
  isAlive?: boolean;
}

/**
 * WsManager — singleton that manages per-trip WebSocket rooms.
 * Call broadcast() after any mutation to push updates to all connected clients.
 */
class WsManager {
  // rooms: tripId → Set of connected WebSocket clients in that trip
  private rooms: Map<string, Set<ExtendedWs>> = new Map();

  addToRoom(tripId: string, ws: ExtendedWs): void {
    if (!this.rooms.has(tripId)) {
      this.rooms.set(tripId, new Set());
    }
    this.rooms.get(tripId)!.add(ws);

    if (!ws.rooms) ws.rooms = new Set();
    ws.rooms.add(tripId);
  }

  removeFromRoom(tripId: string, ws: ExtendedWs): void {
    const room = this.rooms.get(tripId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(tripId);
      }
    }
    ws.rooms?.delete(tripId);
  }

  removeFromAllRooms(ws: ExtendedWs): void {
    if (ws.rooms) {
      ws.rooms.forEach((tripId) => this.removeFromRoom(tripId, ws));
    }
  }

  broadcast(tripId: string, eventType: string, payload: unknown): void {
    const room = this.rooms.get(tripId);
    if (!room || room.size === 0) return;

    const message = JSON.stringify({ type: eventType, payload });

    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Broadcasts an event to the dashboard rooms of the given user IDs.
   * Dashboard rooms use the key `dashboard:<userId>`.
   */
  broadcastToDashboards(userIds: string[], eventType: string, payload: unknown): void {
    userIds.forEach((userId) => {
      this.broadcast(`dashboard:${userId}`, eventType, payload);
    });
  }

  getRoomSize(tripId: string): number {
    return this.rooms.get(tripId)?.size ?? 0;
  }
}

// Export as singleton
export const wsManager = new WsManager();
export type { ExtendedWs };
