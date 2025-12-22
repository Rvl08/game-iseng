// Game Constants and Types

export const TILE_SIZE = 16;
export const WORLD_WIDTH = 80;
export const WORLD_HEIGHT = 50;
export const GRAVITY = 0.5;
export const JUMP_FORCE = -10;
export const MOVE_SPEED = 3;
export const MAX_PLAYERS = 16;

export const COLORS = {
  bg: '#0a0a12',
  bgGradient: '#12121f',
  primary: '#ff3366',
  secondary: '#00ffcc',
  accent: '#ffcc00',
  warning: '#ff6600',
  text: '#e8e8f0',
  textDim: '#6a6a8a',
  ground: '#3d2817',
  groundLight: '#5c4030',
  stone: '#4a4a5a',
  stoneLight: '#6a6a7a',
  sky: '#1a1a2e',
  fog: 'rgba(120, 0, 60, 0.6)',
  chest: '#ffd700',
  health: '#ff3366',
  healthBg: '#2a1520',
};

export const BLOCKS = {
  AIR: 0,
  DIRT: 1,
  STONE: 2,
  CHEST: 3,
  SPAWN: 4,
} as const;

export const WEAPONS = {
  FIST: { name: 'Fist', damage: 10, range: 30, type: 'melee', icon: '👊' },
  SWORD: { name: 'Pixel Sword', damage: 25, range: 40, type: 'melee', icon: '⚔️' },
  AXE: { name: 'Battle Axe', damage: 35, range: 35, type: 'melee', icon: '🪓' },
  BOW: { name: 'Bow', damage: 20, range: 200, type: 'ranged', icon: '🏹' },
  BLASTER: { name: 'Blaster', damage: 15, range: 300, type: 'ranged', icon: '🔫' },
} as const;

export const SPRITE_PATTERNS = {
  idle: [
    '  ████  ',
    ' ██████ ',
    ' █ ██ █ ',
    ' ██████ ',
    '  ████  ',
    '  ████  ',
    ' ██  ██ ',
    ' ██  ██ ',
  ],
  jump: [
    '  ████  ',
    ' ██████ ',
    ' █ ██ █ ',
    ' ██████ ',
    '  ████  ',
    ' ██████ ',
    '██    ██',
    '        ',
  ],
  attack: [
    '  ████  ',
    ' ██████ ',
    ' █ ██ █ ',
    ' ██████ ',
    ' █████  ',
    ' ████ ██',
    ' ██  ██ ',
    ' ██  ██ ',
  ],
  dead: [
    '        ',
    '        ',
    '████████',
    '█ ██ █ █',
    '████████',
    '        ',
    '        ',
    '        ',
  ],
};

export interface Weapon {
  name: string;
  damage: number;
  range: number;
  type: 'melee' | 'ranged';
  icon: string;
}

export interface InventoryItem {
  type: 'weapon' | 'block';
  item: Weapon | { name: string; count: number };
}

export interface Player {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  health: number;
  maxHealth: number;
  facing: number;
  isJumping: boolean;
  isAttacking: boolean;
  isDead: boolean;
  inventory: (InventoryItem | null)[];
  selectedSlot: number;
  kills: number;
  blocks: number;
  invulnerable: number;
}

export interface Zone {
  x: number;
  y: number;
  radius: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface KillFeedEntry {
  id: number;
  killer: string;
  killerColor: string;
  victim: string;
  victimColor: string;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  language: 'en' | 'id';
}

export interface GameState {
  phase: 'lobby' | 'countdown' | 'playing' | 'gameover';
  world: number[][];
  players: Player[];
  zone: Zone;
  camera: Camera;
  gameCode: string;
  countdown: number | null;
}

export const translations = {
  en: {
    title: 'PIXEL-CLASH',
    subtitle: 'BATTLE ROYALE',
    hostGame: 'HOST GAME',
    joinGame: 'JOIN GAME',
    yourName: 'YOUR NAME',
    join: 'JOIN',
    scanToJoin: 'SCAN TO JOIN',
    gameCode: 'GAME CODE',
    playersWaiting: 'PLAYERS WAITING',
    startBattle: 'START BATTLE',
    lobby: 'LOBBY',
    battle: 'BATTLE',
    gameOver: 'GAME OVER',
    alive: 'ALIVE',
    zoneShrinking: 'ZONE SHRINKING',
    leaderboard: 'LEADERBOARD',
    kills: 'KILLS',
    eliminated: 'ELIMINATED',
    youPlaced: 'YOU PLACED',
    winner: 'WINNER',
    victory: 'VICTORY!',
    playAgain: 'PLAY AGAIN',
    settings: 'SETTINGS',
    connecting: 'CONNECTING...',
    zoneClosing: 'ZONE CLOSING',
    health: 'HEALTH',
    hostDisplay: 'HOST: DISPLAY ON TV/PC',
    joinPhone: 'JOIN: USE PHONE AS CONTROLLER',
    lastStanding: 'LAST PLAYER STANDING WINS!',
    masterVolume: 'MASTER VOLUME',
    musicVolume: 'MUSIC VOLUME',
    sfxVolume: 'SFX VOLUME',
    language: 'LANGUAGE',
    close: 'CLOSE',
  },
  id: {
    title: 'PIXEL-CLASH',
    subtitle: 'BATTLE ROYALE',
    hostGame: 'BUAT GAME',
    joinGame: 'GABUNG GAME',
    yourName: 'NAMA KAMU',
    join: 'GABUNG',
    scanToJoin: 'SCAN UNTUK GABUNG',
    gameCode: 'KODE GAME',
    playersWaiting: 'PEMAIN MENUNGGU',
    startBattle: 'MULAI PERTEMPURAN',
    lobby: 'LOBI',
    battle: 'PERTEMPURAN',
    gameOver: 'GAME SELESAI',
    alive: 'HIDUP',
    zoneShrinking: 'ZONA MENYUSUT',
    leaderboard: 'PAPAN SKOR',
    kills: 'BUNUH',
    eliminated: 'TERELIMINASI',
    youPlaced: 'PERINGKAT KAMU',
    winner: 'PEMENANG',
    victory: 'MENANG!',
    playAgain: 'MAIN LAGI',
    settings: 'PENGATURAN',
    connecting: 'MENGHUBUNGKAN...',
    zoneClosing: 'ZONA MENUTUP',
    health: 'NYAWA',
    hostDisplay: 'HOST: TAMPILKAN DI TV/PC',
    joinPhone: 'GABUNG: GUNAKAN HP SEBAGAI CONTROLLER',
    lastStanding: 'PEMAIN TERAKHIR MENANG!',
    masterVolume: 'VOLUME UTAMA',
    musicVolume: 'VOLUME MUSIK',
    sfxVolume: 'VOLUME EFEK',
    language: 'BAHASA',
    close: 'TUTUP',
  },
};

export const PLAYER_COLORS = [
  '#ff3366', '#00ffcc', '#ffcc00', '#ff6600',
  '#66ff33', '#cc33ff', '#33ccff', '#ff33cc',
  '#ffff33', '#33ff99', '#9933ff', '#ff9933',
  '#33ffff', '#ff3399', '#99ff33', '#3399ff',
];

// Helper functions
export const createPlayer = (id: string, name: string, color: string, x: number, y: number): Player => ({
  id,
  name,
  color,
  x,
  y,
  vx: 0,
  vy: 0,
  health: 100,
  maxHealth: 100,
  facing: 1,
  isJumping: false,
  isAttacking: false,
  isDead: false,
  inventory: [
    { type: 'weapon', item: WEAPONS.FIST },
    null, null, null, null
  ],
  selectedSlot: 0,
  kills: 0,
  blocks: 10,
  invulnerable: 0,
});

export const generateWorld = (seed: number): number[][] => {
  const world: number[][] = [];
  const rng = (x: number) => {
    const s = Math.sin(seed * 9999 + x) * 10000;
    return s - Math.floor(s);
  };
  
  for (let y = 0; y < WORLD_HEIGHT; y++) {
    world[y] = [];
    for (let x = 0; x < WORLD_WIDTH; x++) {
      const surfaceHeight = Math.floor(WORLD_HEIGHT * 0.6 + Math.sin(x * 0.1 + seed) * 5 + rng(x * y) * 3);
      
      if (y < surfaceHeight - 10) {
        world[y][x] = BLOCKS.AIR;
      } else if (y < surfaceHeight) {
        const caveNoise = Math.sin(x * 0.2 + seed) * Math.cos(y * 0.3) + rng(x + y * WORLD_WIDTH) * 0.5;
        world[y][x] = caveNoise > 0.3 ? BLOCKS.AIR : BLOCKS.DIRT;
      } else if (y < surfaceHeight + 5) {
        world[y][x] = BLOCKS.DIRT;
      } else {
        world[y][x] = BLOCKS.STONE;
      }
      
      if (world[y][x] === BLOCKS.AIR && y > 10 && rng(x * 100 + y) > 0.985) {
        world[y][x] = BLOCKS.CHEST;
      }
    }
  }
  
  // Add platforms
  for (let i = 0; i < 15; i++) {
    const px = Math.floor(rng(i * 7) * (WORLD_WIDTH - 10)) + 5;
    const py = Math.floor(rng(i * 13) * (WORLD_HEIGHT * 0.5)) + 5;
    const width = Math.floor(rng(i * 17) * 8) + 4;
    for (let x = px; x < px + width && x < WORLD_WIDTH; x++) {
      if (world[py] && world[py][x] === BLOCKS.AIR) {
        world[py][x] = BLOCKS.STONE;
      }
    }
  }
  
  return world;
};
