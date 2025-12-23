import { Client, Room } from "colyseus.js";
import type { Player } from "./constants";

// Colyseus client instance
let client: Client | null = null;
let room: Room | null = null;

/**
 * Initialize Colyseus client
 */
export async function initializeColyseus(serverUrl: string): Promise<boolean> {
  try {
    client = new Client(serverUrl);
    return true;
  } catch (error) {
    console.error("Failed to initialize Colyseus:", error);
    return false;
  }
}

/**
 * Create or join a game room
 */
export async function joinOrCreateRoom(playerName: string): Promise<Room | null> {
  if (!client) {
    console.error("Colyseus client not initialized");
    return null;
  }

  try {
    room = await client.joinOrCreate("game_room", { playerName });
    console.log("Joined room:", room.roomId);
    return room;
  } catch (error) {
    console.error("Failed to join room:", error);
    return null;
  }
}

/**
 * Get current room
 */
export function getCurrentRoom(): Room | null {
  return room;
}

/**
 * Send player movement
 */
export function sendMove(x: number, y: number) {
  if (room) {
    room.send("move", { x, y });
  }
}

/**
 * Send jump action
 */
export function sendJump() {
  if (room) {
    room.send("jump");
  }
}

/**
 * Send attack action
 */
export function sendAction() {
  if (room) {
    room.send("action");
  }
}

/**
 * Send slot selection
 */
export function sendSelectSlot(slot: number) {
  if (room) {
    room.send("selectSlot", { slot });
  }
}

/**
 * Start game (host only)
 */
export function sendStartGame() {
  if (room) {
    room.send("startGame");
  }
}

/**
 * Leave room
 */
export async function leaveRoom() {
  if (room) {
    await room.leave();
    room = null;
  }
}

/**
 * Convert Colyseus player schema to game Player type
 */
export function schemaToPlayer(schema: any): Player {
  return {
    id: schema.id,
    name: schema.name,
    color: schema.color,
    x: schema.x,
    y: schema.y,
    vx: schema.vx,
    vy: schema.vy,
    health: schema.health,
    maxHealth: schema.maxHealth,
    facing: schema.facing,
    isJumping: schema.isJumping,
    isAttacking: schema.isAttacking,
    isDead: schema.isDead,
    kills: schema.kills,
    blocks: schema.blocks,
    selectedSlot: schema.selectedSlot,
    inventory: JSON.parse(schema.inventory || "[]"),
    invulnerable: schema.invulnerable,
  };
}
