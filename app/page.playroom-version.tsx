"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { isHost, isStreamScreen, myPlayer, onPlayerJoin, PlayerState, RPC } from "playroomkit";
import { audioManager } from "@/lib/audio";
import { ParticleSystem, ScreenShake } from "@/lib/particles";
import {
  initializePlayroom,
  playerStateToPlayer,
  updatePlayerState,
  PLAYROOM_STATES,
  PLAYER_STATES,
} from "@/lib/playroom";
import {
  TILE_SIZE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  GRAVITY,
  JUMP_FORCE,
  MOVE_SPEED,
  MAX_PLAYERS,
  COLORS,
  BLOCKS,
  WEAPONS,
  SPRITE_PATTERNS,
  PLAYER_COLORS,
  translations,
  createPlayer,
  generateWorld,
  type Player,
  type GameState,
  type GameSettings,
  type KillFeedEntry,
} from "@/lib/constants";

// Read remaining component code from original file
// Import all helper components that were in the original file

// ============================================================================
// COMPONENTS
// ============================================================================

function VirtualJoystick({ onMove, size = 120 }: { onMove: (pos: { x: number; y: number }) => void; size?: number }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsActive(true);
  }, []);

  const handleMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isActive || !containerRef.current) return;
      e.preventDefault();

      const touch = "touches" in e ? e.touches[0] : e;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;

      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = size / 2 - 20;

      if (distance > maxDistance) {
        dx = (dx / distance) * maxDistance;
        dy = (dy / distance) * maxDistance;
      }

      setPosition({ x: dx, y: dy });
      onMove({ x: dx / maxDistance, y: dy / maxDistance });
    },
    [isActive, size, onMove]
  );

  const handleEnd = useCallback(() => {
    setIsActive(false);
    setPosition({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      className="rounded-full flex items-center justify-center select-none"
      style={{
        width: size,
        height: size,
        background: "radial-gradient(circle, rgba(255,51,102,0.2) 0%, rgba(255,51,102,0.05) 100%)",
        border: "3px solid rgba(255,51,102,0.4)",
        touchAction: "none",
      }}
    >
      <div
        className="rounded-full"
        style={{
          width: 50,
          height: 50,
          background: isActive
            ? "radial-gradient(circle, #ff3366 0%, #cc2952 100%)"
            : "radial-gradient(circle, rgba(255,51,102,0.6) 0%, rgba(255,51,102,0.3) 100%)",
          transform: `translate(${position.x}px, ${position.y}px)`,
          boxShadow: isActive ? "0 0 20px rgba(255,51,102,0.6)" : "none",
          transition: isActive ? "none" : "transform 0.2s ease-out",
        }}
      />
    </div>
  );
}

function ActionButton({
  label,
  color,
  onPress,
  size = 70,
}: {
  label: string;
  color: string;
  onPress: () => void;
  size?: number;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      setIsPressed(true);
      onPress();
    },
    [onPress]
  );

  const handleRelease = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(false);
  }, []);

  return (
    <div
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      onMouseLeave={handleRelease}
      className="rounded-full flex items-center justify-center select-none cursor-pointer font-bold transition-transform"
      style={{
        width: size,
        height: size,
        background: isPressed
          ? `radial-gradient(circle, ${color} 0%, ${color}cc 100%)`
          : `radial-gradient(circle, ${color}dd 0%, ${color}88 100%)`,
        border: `3px solid ${color}`,
        color: "#000",
        fontSize: size * 0.4,
        boxShadow: isPressed ? `0 0 30px ${color}` : `0 4px 0 ${color}88`,
        transform: isPressed ? "translateY(4px) scale(0.95)" : "translateY(0)",
        touchAction: "none",
      }}
    >
      {label}
    </div>
  );
}

// Game Canvas Component
function GameCanvas({
  world,
  players,
  zone,
  camera,
  isHost,
  particles,
  screenShake,
}: {
  world: number[][];
  players: Player[];
  zone: { x: number; y: number; radius: number };
  camera: { x: number; y: number; zoom: number };
  isHost: boolean;
  particles?: ParticleSystem;
  screenShake?: ScreenShake;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = isHost ? 1200 : 400;
    const height = isHost ? 700 : 300;

    canvas.width = width;
    canvas.height = height;

    const shake = screenShake ? screenShake.getOffset() : { x: 0, y: 0 };

    ctx.save();
    ctx.translate(shake.x, shake.y);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // Background
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(camera.x, camera.y, width / camera.zoom, height / camera.zoom);

    // World
    for (let y = 0; y < WORLD_HEIGHT; y++) {
      for (let x = 0; x < WORLD_WIDTH; x++) {
        const block = world[y][x];
        if (block === BLOCKS.AIR) continue;

        const screenX = x * TILE_SIZE;
        const screenY = y * TILE_SIZE;

        if (
          screenX < camera.x - TILE_SIZE ||
          screenX > camera.x + width / camera.zoom ||
          screenY < camera.y - TILE_SIZE ||
          screenY > camera.y + height / camera.zoom
        )
          continue;

        if (block === BLOCKS.DIRT) {
          ctx.fillStyle = COLORS.ground;
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.groundLight;
          ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 2);
        } else if (block === BLOCKS.STONE) {
          ctx.fillStyle = COLORS.stone;
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.stoneLight;
          ctx.fillRect(screenX + 3, screenY + 3, TILE_SIZE - 6, 2);
        } else if (block === BLOCKS.CHEST) {
          ctx.fillStyle = COLORS.chest;
          ctx.fillRect(screenX + 2, screenY + 4, TILE_SIZE - 4, TILE_SIZE - 6);
          ctx.fillStyle = "#000";
          ctx.fillRect(screenX + 6, screenY + 8, 4, 2);
        }
      }
    }

    // Zone
    ctx.strokeStyle = COLORS.fog;
    ctx.lineWidth = 40;
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Players
    players.forEach((player) => {
      if (player.isDead) return;

      const pattern = player.isAttacking
        ? SPRITE_PATTERNS.attack
        : player.isJumping
        ? SPRITE_PATTERNS.jump
        : SPRITE_PATTERNS.idle;

      ctx.save();
      ctx.translate(player.x, player.y);
      if (player.facing < 0) ctx.scale(-1, 1);

      pattern.forEach((row, py) => {
        row.split("").forEach((char, px) => {
          if (char === "█") {
            ctx.fillStyle = player.invulnerable > 0 && Math.floor(Date.now() / 100) % 2 === 0 ? "#fff" : player.color;
            ctx.fillRect((px - 4) * 2, (py - 4) * 2, 2, 2);
          }
        });
      });

      ctx.restore();

      // Name and health
      ctx.fillStyle = player.color;
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(player.name, player.x, player.y - 20);

      const healthWidth = 30;
      const healthHeight = 3;
      ctx.fillStyle = COLORS.healthBg;
      ctx.fillRect(player.x - healthWidth / 2, player.y - 15, healthWidth, healthHeight);
      ctx.fillStyle = COLORS.health;
      ctx.fillRect(
        player.x - healthWidth / 2,
        player.y - 15,
        (player.health / player.maxHealth) * healthWidth,
        healthHeight
      );
    });

    // Particles
    if (particles) {
      particles.particles.forEach((particle) => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life;
        ctx.fillRect(particle.x - 1, particle.y - 1, 2, 2);
        ctx.globalAlpha = 1;
      });
    }

    ctx.restore();
  }, [world, players, zone, camera, isHost, particles, screenShake]);

  return (
    <canvas
      ref={canvasRef}
      width={isHost ? 1200 : 400}
      height={isHost ? 700 : 300}
      className="w-full h-full"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

// Other helper components
function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  return (
    <div
      className="w-full h-3 rounded overflow-hidden"
      style={{ background: COLORS.healthBg, border: `1px solid ${COLORS.health}40` }}
    >
      <div
        className="h-full transition-all"
        style={{
          width: `${(health / maxHealth) * 100}%`,
          background: `linear-gradient(90deg, ${COLORS.health} 0%, #ff6699 100%)`,
        }}
      />
    </div>
  );
}

function InventorySlot({ item, isSelected, onClick }: { item: any; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="w-12 h-12 flex items-center justify-center rounded cursor-pointer transition-all"
      style={{
        background: isSelected ? COLORS.primary + "40" : "rgba(255,255,255,0.1)",
        border: `2px solid ${isSelected ? COLORS.primary : COLORS.textDim + "40"}`,
        boxShadow: isSelected ? `0 0 10px ${COLORS.primary}` : "none",
      }}
    >
      {item && <span className="text-base">{item.item.icon || "?"}</span>}
    </div>
  );
}

function CountdownOverlay({ count }: { count: number }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="text-9xl font-bold animate-ping"
        style={{
          color: count === 0 ? COLORS.secondary : COLORS.accent,
          textShadow: `0 0 40px ${count === 0 ? COLORS.secondary : COLORS.accent}`,
        }}
      >
        {count === 0 ? "GO!" : count}
      </div>
    </div>
  );
}

function KillFeed({ kills }: { kills: KillFeedEntry[] }) {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-1">
      {kills.slice(-5).map((kill) => (
        <div
          key={kill.id}
          className="px-3 py-1 rounded text-xs animate-fade-in"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <span style={{ color: kill.killerColor }}>{kill.killer}</span>
          <span style={{ color: COLORS.textDim }}> 💀 </span>
          <span style={{ color: kill.victimColor }}>{kill.victim}</span>
        </div>
      ))}
    </div>
  );
}

function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onSettingsChange: (s: GameSettings) => void;
}) {
  if (!isOpen) return null;

  const t = translations[settings.language];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-5"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-5 rounded-lg"
        style={{ background: COLORS.bg, border: `2px solid ${COLORS.primary}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl mb-5" style={{ color: COLORS.primary }}>
          {t.settings}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs block mb-2" style={{ color: COLORS.text }}>
              {t.masterVolume}: {settings.masterVolume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.masterVolume}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                onSettingsChange({ ...settings, masterVolume: v });
                audioManager.setMasterVolume(v / 100);
              }}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs block mb-2" style={{ color: COLORS.text }}>
              {t.musicVolume}: {settings.musicVolume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.musicVolume}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                onSettingsChange({ ...settings, musicVolume: v });
                audioManager.setMusicVolume(v / 100);
              }}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs block mb-2" style={{ color: COLORS.text }}>
              {t.sfxVolume}: {settings.sfxVolume}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.sfxVolume}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                onSettingsChange({ ...settings, sfxVolume: v });
                audioManager.setSfxVolume(v / 100);
              }}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs block mb-2" style={{ color: COLORS.text }}>
              {t.language}
            </label>
            <select
              value={settings.language}
              onChange={(e) => onSettingsChange({ ...settings, language: e.target.value as "en" | "id" })}
              className="w-full px-3 py-2 rounded"
              style={{ background: "rgba(255,255,255,0.1)", border: `1px solid ${COLORS.textDim}`, color: COLORS.text }}
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded cursor-pointer"
          style={{ background: COLORS.primary, color: "#fff" }}
        >
          {t.close}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT WITH PLAYROOM INTEGRATION
// ============================================================================

export default function PixelClashGame() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [currentPlayerState, setCurrentPlayerState] = useState<PlayerState | null>(null);
  const [allPlayers, setAllPlayers] = useState<PlayerState[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);

  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 70,
    musicVolume: 30,
    sfxVolume: 80,
    language: "en",
  });

  const particlesRef = useRef(new ParticleSystem());
  const screenShakeRef = useRef(new ScreenShake());
  const gameStateRef = useRef<GameState | null>(null);

  const [gameState, setGameState] = useState<GameState>(() => ({
    phase: "lobby",
    world: generateWorld(Date.now()),
    players: [],
    zone: {
      x: (WORLD_WIDTH * TILE_SIZE) / 2,
      y: (WORLD_HEIGHT * TILE_SIZE) / 2,
      radius: WORLD_WIDTH * TILE_SIZE,
    },
    camera: { x: 0, y: WORLD_HEIGHT * TILE_SIZE * 0.3, zoom: 1 },
    gameCode: "",
    countdown: null,
  }));

  const t = translations[settings.language];

  // Initialize Playroom
  useEffect(() => {
    async function init() {
      const success = await initializePlayroom();
      if (success) {
        setIsInitialized(true);
        const player = myPlayer();
        setCurrentPlayerState(player);
        setIsConnecting(false);
      } else {
        console.error("Failed to initialize Playroom");
        setIsConnecting(false);
      }
    }
    init();
  }, []);

  // Setup player join/leave handlers
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = onPlayerJoin((playerState) => {
      console.log("Player joined:", playerState.id);

      setAllPlayers((prev) => {
        const exists = prev.find((p) => p.id === playerState.id);
        if (exists) return prev;
        return [...prev, playerState];
      });

      // Initialize player position if host
      if (isHost()) {
        const colorIndex = allPlayers.length % PLAYER_COLORS.length;
        const spawnX = 100 + Math.random() * (WORLD_WIDTH * TILE_SIZE - 200);
        const spawnY = 50;

        updatePlayerState(playerState, {
          color: PLAYER_COLORS[colorIndex],
          x: spawnX,
          y: spawnY,
          health: 100,
        });
      }

      // Handle player leave
      playerState.onQuit(() => {
        console.log("Player left:", playerState.id);
        setAllPlayers((prev) => prev.filter((p) => p.id !== playerState.id));
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isInitialized, allPlayers.length]);

  // Sync game state with Playroom
  useEffect(() => {
    if (!isInitialized || !currentPlayerState) return;

    const players = allPlayers.map(playerStateToPlayer);
    setGameState((prev) => ({ ...prev, players }));
  }, [isInitialized, currentPlayerState, allPlayers]);

  // Audio initialization
  const initAudio = useCallback(async () => {
    if (!audioInitialized) {
      await audioManager.init();
      setAudioInitialized(true);
    }
  }, [audioInitialized]);

  // Handle player input
  const handlePlayerInput = useCallback(
    (input: { type: string; x?: number; y?: number; slot?: number }) => {
      if (!currentPlayerState) return;

      const player = playerStateToPlayer(currentPlayerState);
      const updates: Partial<Player> = {};

      switch (input.type) {
        case "move":
          updates.vx = (input.x || 0) * MOVE_SPEED;
          if (input.x && input.x !== 0) updates.facing = input.x > 0 ? 1 : -1;
          break;
        case "jump":
          if (!player.isJumping) {
            updates.vy = JUMP_FORCE;
            updates.isJumping = true;
            audioManager.playSound("jump");
            particlesRef.current.jump(player.x, player.y);
          }
          break;
        case "action":
          updates.isAttacking = true;
          audioManager.playSound("attack");
          setTimeout(() => {
            updatePlayerState(currentPlayerState, { isAttacking: false });
          }, 200);
          break;
        case "selectSlot":
          updates.selectedSlot = input.slot || 0;
          audioManager.playSound("menuSelect");
          break;
      }

      updatePlayerState(currentPlayerState, updates);
    },
    [currentPlayerState]
  );

  // Start game (host only)
  const startGame = useCallback(async () => {
    if (!isHost()) return;

    await initAudio();
    audioManager.playSound("menuConfirm");

    RPC.call("startGame", null, RPC.Mode.ALL);
  }, [initAudio]);

  // RPC handler for starting game
  useEffect(() => {
    if (!isInitialized) return;

    RPC.register("startGame", async () => {
      setGameState((prev) => ({ ...prev, phase: "countdown", countdown: 3 }));

      for (let i = 3; i >= 0; i--) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        audioManager.playSound(i > 0 ? "countdown" : "gameStart");
        setGameState((prev) => ({ ...prev, countdown: i }));
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setGameState((prev) => ({ ...prev, phase: "playing", countdown: null }));
      audioManager.startMusic("battle");
    });
  }, [isInitialized]);

  // Game loop (host only)
  useEffect(() => {
    if (!isHost() || gameState.phase !== "playing") return;

    const interval = setInterval(() => {
      particlesRef.current.update();
      screenShakeRef.current.update();

      setGameState((prev) => {
        let { players, world, zone } = prev;

        // Update physics for all players
        players = players.map((player) => {
          if (player.isDead) return player;

          let { x, y, vx, vy, isJumping, health, invulnerable } = player;

          vy += GRAVITY;
          x += vx;
          y += vy;

          // Collision detection
          const collisionPoints = [
            { x: Math.floor(x / TILE_SIZE), y: Math.floor((y + 16) / TILE_SIZE) },
            { x: Math.floor((x + 15) / TILE_SIZE), y: Math.floor((y + 16) / TILE_SIZE) },
          ];

          let onGround = false;
          for (const point of collisionPoints) {
            if (point.y >= 0 && point.y < WORLD_HEIGHT && point.x >= 0 && point.x < WORLD_WIDTH) {
              if (world[point.y][point.x] !== 0) {
                y = point.y * TILE_SIZE - 16;
                vy = 0;
                onGround = true;
                isJumping = false;
              }
            }
          }

          // Bounds check
          x = Math.max(0, Math.min(WORLD_WIDTH * TILE_SIZE - 16, x));
          y = Math.max(0, y);

          // Zone damage
          const distToZone = Math.sqrt((x - zone.x) ** 2 + (y - zone.y) ** 2);
          if (distToZone > zone.radius && invulnerable <= 0) {
            health -= 2;
            if (health <= 0) {
              return { ...player, isDead: true, health: 0 };
            }
          }

          if (invulnerable > 0) invulnerable--;

          // Find corresponding PlayerState and update
          const playerState = allPlayers.find((p) => p.id === player.id);
          if (playerState) {
            updatePlayerState(playerState, { x, y, vx, vy, isJumping, health, invulnerable });
          }

          return { ...player, x, y, vx, vy, isJumping, health, invulnerable };
        });

        // Shrink zone
        const newRadius = Math.max(100, zone.radius - 0.2);
        zone = { ...zone, radius: newRadius };

        // Camera
        const alivePlayers = players.filter((p) => !p.isDead);
        let camera = prev.camera;

        if (alivePlayers.length > 0) {
          const minX = Math.min(...alivePlayers.map((p) => p.x));
          const maxX = Math.max(...alivePlayers.map((p) => p.x));
          const minY = Math.min(...alivePlayers.map((p) => p.y));
          const maxY = Math.max(...alivePlayers.map((p) => p.y));

          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          const spanX = maxX - minX + 200;
          const spanY = maxY - minY + 200;

          const newZoom = Math.min(2, Math.max(0.5, Math.min(1200 / spanX, 700 / spanY)));

          camera = {
            x: centerX - 600 / newZoom,
            y: centerY - 350 / newZoom,
            zoom: camera.zoom * 0.95 + newZoom * 0.05,
          };
        }

        // Check win condition
        if (alivePlayers.length <= 1 && players.length > 1) {
          audioManager.stopMusic();
          if (alivePlayers.length === 1) audioManager.playSound("victory");
          return { ...prev, players, zone, camera, phase: "gameover" };
        }

        return { ...prev, players, zone, camera };
      });
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [gameState.phase, allPlayers]);

  // Loading state
  if (isConnecting) {
    return (
      <div className="w-full h-screen flex items-center justify-center font-pixel" style={{ background: COLORS.bg }}>
        <div className="text-center" style={{ color: COLORS.text }}>
          <div className="text-2xl mb-5">⏳</div>
          {t.connecting}
        </div>
      </div>
    );
  }

  if (!isInitialized || !currentPlayerState) {
    return (
      <div className="w-full h-screen flex items-center justify-center font-pixel" style={{ background: COLORS.bg }}>
        <div className="text-center" style={{ color: COLORS.text }}>
          <div className="text-2xl mb-5">❌</div>
          Failed to connect to Playroom
        </div>
      </div>
    );
  }

  const currentPlayer = playerStateToPlayer(currentPlayerState);
  const alivePlayers = gameState.players.filter((p) => !p.isDead);
  const winner = gameState.phase === "gameover" && alivePlayers.length === 1 ? alivePlayers[0] : null;

  // HOST/STREAM VIEW
  if (isHost() || isStreamScreen()) {
    return (
      <div
        className="w-full h-screen flex flex-col font-pixel overflow-hidden"
        style={{ background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bgGradient} 100%)` }}
      >
        <div
          className="flex justify-between items-center px-5 py-3"
          style={{ background: "rgba(0,0,0,0.5)", borderBottom: `2px solid ${COLORS.primary}` }}
        >
          <div className="flex items-center gap-5">
            <h1 className="text-lg m-0" style={{ color: COLORS.primary, textShadow: `0 0 20px ${COLORS.primary}` }}>
              {t.title}
            </h1>
            <div
              className="text-xs px-3 py-1 rounded"
              style={{
                color: COLORS.secondary,
                background: "rgba(0,255,204,0.1)",
                border: `1px solid ${COLORS.secondary}`,
              }}
            >
              {gameState.phase === "lobby"
                ? `⏳ ${t.lobby}`
                : gameState.phase === "playing" || gameState.phase === "countdown"
                ? `🎮 ${t.battle}`
                : `🏆 ${t.gameOver}`}
            </div>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-xs" style={{ color: COLORS.text }}>
              {t.alive}: <span style={{ color: COLORS.secondary }}>{alivePlayers.length}</span>/
              {gameState.players.length}
            </span>
            {gameState.zone.radius < (WORLD_WIDTH * TILE_SIZE) / 2 && (
              <span className="text-xs animate-pulse" style={{ color: COLORS.warning }}>
                ⚠️ {t.zoneShrinking}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 flex relative">
          <div className="flex-1 flex items-center justify-center p-5 relative">
            <div
              className="w-full h-full max-w-[1200px] rounded-lg overflow-hidden relative"
              style={{ border: `3px solid ${COLORS.primary}`, boxShadow: `0 0 40px ${COLORS.primary}40` }}
            >
              {gameState.phase === "lobby" ? (
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-8"
                  style={{ background: "rgba(0,0,0,0.8)" }}
                >
                  <h2 className="text-2xl" style={{ color: COLORS.accent, textShadow: `0 0 20px ${COLORS.accent}` }}>
                    {t.scanToJoin}
                  </h2>
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG value={window.location.href} size={180} />
                  </div>
                  <p className="text-sm" style={{ color: COLORS.text }}>
                    {gameState.players.length} {t.playersWaiting}
                  </p>
                  {gameState.players.length >= 2 && (
                    <button
                      onClick={startGame}
                      className="px-10 py-4 text-sm rounded-lg text-white cursor-pointer hover:scale-105 transition-transform"
                      style={{
                        background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.warning} 100%)`,
                        boxShadow: `0 0 30px ${COLORS.primary}60`,
                      }}
                    >
                      {t.startBattle}
                    </button>
                  )}
                </div>
              ) : (
                <GameCanvas
                  world={gameState.world}
                  players={gameState.players}
                  zone={gameState.zone}
                  camera={gameState.camera}
                  isHost={true}
                  particles={particlesRef.current}
                  screenShake={screenShakeRef.current}
                />
              )}

              {gameState.phase === "countdown" && gameState.countdown !== null && (
                <CountdownOverlay count={gameState.countdown} />
              )}

              {gameState.phase === "gameover" && winner && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.8)" }}
                >
                  <div className="text-5xl mb-5">🏆</div>
                  <div className="text-2xl mb-3" style={{ color: COLORS.accent }}>
                    {t.victory}
                  </div>
                  <div className="text-lg" style={{ color: winner.color }}>
                    {winner.name}
                  </div>
                  <div className="text-sm mt-2" style={{ color: COLORS.text }}>
                    {winner.kills} {t.kills}
                  </div>
                </div>
              )}
            </div>

            {(gameState.phase === "playing" || gameState.phase === "gameover") && <KillFeed kills={killFeed} />}
          </div>

          <div
            className="w-64 p-4 overflow-y-auto"
            style={{ background: "rgba(0,0,0,0.6)", borderLeft: `2px solid ${COLORS.primary}40` }}
          >
            <h3 className="text-xs mb-4 tracking-widest" style={{ color: COLORS.accent }}>
              {t.leaderboard}
            </h3>
            {[...gameState.players]
              .sort((a, b) => b.kills - a.kills || (a.isDead ? 1 : -1))
              .map((player, i) => (
                <div
                  key={player.id}
                  className="flex items-center gap-2 px-2 py-2 mb-1 rounded"
                  style={{
                    background: player.isDead ? "rgba(100,0,0,0.3)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${player.color}40`,
                    opacity: player.isDead ? 0.5 : 1,
                  }}
                >
                  <span className="text-xs w-5" style={{ color: COLORS.accent }}>
                    #{i + 1}
                  </span>
                  <div className="w-3 h-3 rounded-sm" style={{ background: player.color }} />
                  <span
                    className="text-xs flex-1"
                    style={{ color: COLORS.text, textDecoration: player.isDead ? "line-through" : "none" }}
                  >
                    {player.name}
                  </span>
                  <span className="text-xs" style={{ color: COLORS.secondary }}>
                    {player.kills} 💀
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // PLAYER VIEW (Mobile Controller)
  const playerCamera = { x: currentPlayer.x - 200, y: currentPlayer.y - 150, zoom: 2 };

  if (currentPlayer.isDead) {
    return (
      <div
        className="w-full h-screen flex flex-col items-center justify-center gap-5 font-pixel"
        style={{ background: COLORS.bg }}
      >
        <div className="text-5xl">💀</div>
        <div className="text-base" style={{ color: COLORS.primary }}>
          {t.eliminated}
        </div>
        <div className="text-xs" style={{ color: COLORS.textDim }}>
          {t.youPlaced} #{alivePlayers.length + 1}
        </div>
        <div className="text-xs" style={{ color: COLORS.accent }}>
          {currentPlayer.kills} {t.kills}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-screen flex flex-col font-pixel overflow-hidden select-none"
      style={{ background: COLORS.bg, touchAction: "none" }}
    >
      <div className="flex-1 relative" style={{ borderBottom: `2px solid ${COLORS.primary}40` }}>
        <GameCanvas
          world={gameState.world}
          players={gameState.players}
          zone={gameState.zone}
          camera={playerCamera}
          isHost={false}
        />
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
          <div className="w-28">
            <div className="text-xs mb-1" style={{ color: COLORS.textDim }}>
              {t.health}
            </div>
            <HealthBar health={currentPlayer.health} maxHealth={currentPlayer.maxHealth} />
          </div>
          <div className="px-2 py-1 rounded text-xs" style={{ background: "rgba(0,0,0,0.7)", color: COLORS.accent }}>
            {currentPlayer.kills} 💀
          </div>
        </div>
        {gameState.zone.radius < (WORLD_WIDTH * TILE_SIZE) / 2 && (
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs animate-pulse"
            style={{ background: "rgba(255,102,0,0.8)", color: "#fff" }}
          >
            ⚠️ {t.zoneClosing}
          </div>
        )}
      </div>

      <div className="h-48 flex flex-col p-4" style={{ background: "rgba(0,0,0,0.8)" }}>
        <div className="flex gap-2 justify-center mb-4 overflow-x-auto pb-1">
          {currentPlayer.inventory.map((item, i) => (
            <InventorySlot
              key={i}
              item={item}
              isSelected={i === currentPlayer.selectedSlot}
              onClick={() => handlePlayerInput({ type: "selectSlot", slot: i })}
            />
          ))}
        </div>
        <div className="flex-1 flex justify-between items-center px-5">
          <VirtualJoystick onMove={(pos) => handlePlayerInput({ type: "move", x: pos.x, y: pos.y })} size={100} />
          <div className="flex gap-4">
            <ActionButton
              label="B"
              color={COLORS.warning}
              onPress={() => handlePlayerInput({ type: "action" })}
              size={60}
            />
            <ActionButton
              label="A"
              color={COLORS.secondary}
              onPress={() => handlePlayerInput({ type: "jump" })}
              size={60}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
