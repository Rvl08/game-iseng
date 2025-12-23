// Playroom Kit Integration Utilities
import { insertCoin, isHost, isStreamScreen, myPlayer, onPlayerJoin, Joystick, PlayerState } from 'playroomkit';
import type { Player, GameState } from './constants';

// Playroom State Keys
export const PLAYROOM_STATES = {
  GAME_PHASE: 'gamePhase',
  WORLD_SEED: 'worldSeed',
  ZONE_X: 'zoneX',
  ZONE_Y: 'zoneY',
  ZONE_RADIUS: 'zoneRadius',
  COUNTDOWN: 'countdown',
  KILL_FEED: 'killFeed',
} as const;

// Player State Keys
export const PLAYER_STATES = {
  NAME: 'name',
  COLOR: 'color',
  X: 'x',
  Y: 'y',
  VX: 'vx',
  VY: 'vy',
  HEALTH: 'health',
  FACING: 'facing',
  IS_JUMPING: 'isJumping',
  IS_ATTACKING: 'isAttacking',
  IS_DEAD: 'isDead',
  KILLS: 'kills',
  BLOCKS: 'blocks',
  SELECTED_SLOT: 'selectedSlot',
  INVENTORY: 'inventory',
  INVULNERABLE: 'invulnerable',
} as const;

/**
 * Initialize Playroom connection
 * Returns true if successfully initialized
 */
export async function initializePlayroom(): Promise<boolean> {
  try {
    const gameId = process.env.NEXT_PUBLIC_PLAYROOM_GAME_ID;

    if (!gameId) {
      console.error('NEXT_PUBLIC_PLAYROOM_GAME_ID is not defined');
      return false;
    }

    await insertCoin({
      gameId,
      skipLobby: false,
      matchmaking: true,
      maxPlayersPerRoom: 16,
      defaultPlayerStates: {
        [PLAYER_STATES.NAME]: '',
        [PLAYER_STATES.COLOR]: '#ff3366',
        [PLAYER_STATES.X]: 0,
        [PLAYER_STATES.Y]: 0,
        [PLAYER_STATES.VX]: 0,
        [PLAYER_STATES.VY]: 0,
        [PLAYER_STATES.HEALTH]: 100,
        [PLAYER_STATES.FACING]: 1,
        [PLAYER_STATES.IS_JUMPING]: false,
        [PLAYER_STATES.IS_ATTACKING]: false,
        [PLAYER_STATES.IS_DEAD]: false,
        [PLAYER_STATES.KILLS]: 0,
        [PLAYER_STATES.BLOCKS]: 10,
        [PLAYER_STATES.SELECTED_SLOT]: 0,
        [PLAYER_STATES.INVENTORY]: JSON.stringify([{ type: 'weapon', item: 'FIST' }, null, null, null, null]),
        [PLAYER_STATES.INVULNERABLE]: 0,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to initialize Playroom:', error);
    return false;
  }
}

/**
 * Check if current instance is the host
 */
export function getIsHost(): boolean {
  return isHost();
}

/**
 * Check if current instance is a stream screen (display)
 */
export function getIsStreamScreen(): boolean {
  return isStreamScreen();
}

/**
 * Get current player
 */
export function getCurrentPlayer(): PlayerState | null {
  return myPlayer();
}

/**
 * Setup player join handler
 */
export function setupPlayerJoinHandler(callback: (player: PlayerState) => void): void {
  onPlayerJoin(callback);
}

/**
 * Convert Playroom PlayerState to our Player type
 */
export function playerStateToPlayer(playerState: PlayerState): Player {
  return {
    id: playerState.id,
    name: playerState.getState(PLAYER_STATES.NAME) || 'Player',
    color: playerState.getState(PLAYER_STATES.COLOR) || '#ff3366',
    x: playerState.getState(PLAYER_STATES.X) || 0,
    y: playerState.getState(PLAYER_STATES.Y) || 0,
    vx: playerState.getState(PLAYER_STATES.VX) || 0,
    vy: playerState.getState(PLAYER_STATES.VY) || 0,
    health: playerState.getState(PLAYER_STATES.HEALTH) || 100,
    maxHealth: 100,
    facing: playerState.getState(PLAYER_STATES.FACING) || 1,
    isJumping: playerState.getState(PLAYER_STATES.IS_JUMPING) || false,
    isAttacking: playerState.getState(PLAYER_STATES.IS_ATTACKING) || false,
    isDead: playerState.getState(PLAYER_STATES.IS_DEAD) || false,
    kills: playerState.getState(PLAYER_STATES.KILLS) || 0,
    blocks: playerState.getState(PLAYER_STATES.BLOCKS) || 10,
    selectedSlot: playerState.getState(PLAYER_STATES.SELECTED_SLOT) || 0,
    inventory: JSON.parse(playerState.getState(PLAYER_STATES.INVENTORY) || '[]'),
    invulnerable: playerState.getState(PLAYER_STATES.INVULNERABLE) || 0,
  };
}

/**
 * Update player state in Playroom
 */
export function updatePlayerState(playerState: PlayerState, updates: Partial<Player>): void {
  if (updates.name !== undefined) playerState.setState(PLAYER_STATES.NAME, updates.name);
  if (updates.color !== undefined) playerState.setState(PLAYER_STATES.COLOR, updates.color);
  if (updates.x !== undefined) playerState.setState(PLAYER_STATES.X, updates.x);
  if (updates.y !== undefined) playerState.setState(PLAYER_STATES.Y, updates.y);
  if (updates.vx !== undefined) playerState.setState(PLAYER_STATES.VX, updates.vx);
  if (updates.vy !== undefined) playerState.setState(PLAYER_STATES.VY, updates.vy);
  if (updates.health !== undefined) playerState.setState(PLAYER_STATES.HEALTH, updates.health);
  if (updates.facing !== undefined) playerState.setState(PLAYER_STATES.FACING, updates.facing);
  if (updates.isJumping !== undefined) playerState.setState(PLAYER_STATES.IS_JUMPING, updates.isJumping);
  if (updates.isAttacking !== undefined) playerState.setState(PLAYER_STATES.IS_ATTACKING, updates.isAttacking);
  if (updates.isDead !== undefined) playerState.setState(PLAYER_STATES.IS_DEAD, updates.isDead);
  if (updates.kills !== undefined) playerState.setState(PLAYER_STATES.KILLS, updates.kills);
  if (updates.blocks !== undefined) playerState.setState(PLAYER_STATES.BLOCKS, updates.blocks);
  if (updates.selectedSlot !== undefined) playerState.setState(PLAYER_STATES.SELECTED_SLOT, updates.selectedSlot);
  if (updates.inventory !== undefined) playerState.setState(PLAYER_STATES.INVENTORY, JSON.stringify(updates.inventory));
  if (updates.invulnerable !== undefined) playerState.setState(PLAYER_STATES.INVULNERABLE, updates.invulnerable);
}

/**
 * Create Joystick for player controls
 */
export function createPlayerJoystick(playerState: PlayerState): Joystick {
  return new Joystick(playerState, {
    type: 'angular',
    buttons: [
      { id: 'jump', label: 'Jump' },
      { id: 'action', label: 'Action' },
    ],
  });
}
