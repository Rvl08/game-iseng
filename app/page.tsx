'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { audioManager } from '@/lib/audio';
import { ParticleSystem, ScreenShake } from '@/lib/particles';
import {
  TILE_SIZE, WORLD_WIDTH, WORLD_HEIGHT, GRAVITY, JUMP_FORCE, MOVE_SPEED, MAX_PLAYERS,
  COLORS, BLOCKS, WEAPONS, SPRITE_PATTERNS, PLAYER_COLORS,
  translations, createPlayer, generateWorld,
  type Player, type GameState, type GameSettings, type KillFeedEntry
} from '@/lib/constants';

// ============================================================================
// COMPONENTS
// ============================================================================

// Virtual Joystick Component
function VirtualJoystick({ onMove, size = 120 }: { onMove: (pos: { x: number; y: number }) => void; size?: number }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsActive(true);
  }, []);
  
  const handleMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isActive || !containerRef.current) return;
    e.preventDefault();
    
    const touch = 'touches' in e ? e.touches[0] : e;
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
  }, [isActive, size, onMove]);
  
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
        background: 'radial-gradient(circle, rgba(255,51,102,0.2) 0%, rgba(255,51,102,0.05) 100%)',
        border: '3px solid rgba(255,51,102,0.4)',
        touchAction: 'none',
      }}
    >
      <div
        className="rounded-full transition-transform"
        style={{
          width: 50,
          height: 50,
          background: isActive 
            ? 'radial-gradient(circle, #ff3366 0%, #cc2952 100%)'
            : 'radial-gradient(circle, rgba(255,51,102,0.6) 0%, rgba(255,51,102,0.3) 100%)',
          transform: `translate(${position.x}px, ${position.y}px)`,
          boxShadow: isActive ? '0 0 20px rgba(255,51,102,0.6)' : 'none',
          transition: isActive ? 'none' : 'transform 0.2s ease-out',
        }}
      />
    </div>
  );
}

// Action Button Component
function ActionButton({ label, color, onPress, size = 70 }: { label: string; color: string; onPress: () => void; size?: number }) {
  const [isPressed, setIsPressed] = useState(false);
  
  const handlePress = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressed(true);
    onPress();
    if (navigator.vibrate) navigator.vibrate(30);
  }, [onPress]);
  
  const handleRelease = useCallback(() => {
    setIsPressed(false);
  }, []);
  
  return (
    <div
      onTouchStart={handlePress}
      onTouchEnd={handleRelease}
      onMouseDown={handlePress}
      onMouseUp={handleRelease}
      className="rounded-full flex items-center justify-center font-pixel cursor-pointer select-none"
      style={{
        width: size,
        height: size,
        background: isPressed 
          ? `radial-gradient(circle, ${color} 0%, ${color}aa 100%)`
          : `radial-gradient(circle, ${color}88 0%, ${color}44 100%)`,
        border: `3px solid ${color}`,
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        textShadow: '2px 2px 0 rgba(0,0,0,0.5)',
        transform: isPressed ? 'scale(0.95)' : 'scale(1)',
        boxShadow: isPressed ? `0 0 30px ${color}88` : `0 4px 0 ${color}66`,
        transition: 'transform 0.1s, box-shadow 0.1s',
        touchAction: 'none',
      }}
    >
      {label}
    </div>
  );
}

// Inventory Slot Component
function InventorySlot({ item, isSelected, onClick }: { item: any; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-center cursor-pointer transition-all flex-shrink-0"
      style={{
        width: 50,
        height: 50,
        background: isSelected 
          ? 'linear-gradient(135deg, rgba(255,204,0,0.3) 0%, rgba(255,204,0,0.1) 100%)'
          : 'rgba(20,20,35,0.8)',
        border: isSelected ? '2px solid #ffcc00' : '2px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
      }}
    >
      {item && (
        <div className="text-xl">
          {item.type === 'weapon' ? item.item.icon : item.type === 'block' ? '🧱' : '📦'}
        </div>
      )}
    </div>
  );
}

// Health Bar Component
function HealthBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  return (
    <div 
      className="w-full h-4 rounded-lg overflow-hidden"
      style={{ background: COLORS.healthBg, border: '2px solid rgba(255,51,102,0.3)' }}
    >
      <div 
        className="h-full transition-all duration-300"
        style={{
          width: `${(health / maxHealth) * 100}%`,
          background: health > 30 
            ? `linear-gradient(90deg, ${COLORS.health} 0%, #ff6699 100%)`
            : 'linear-gradient(90deg, #ff0000 0%, #ff3333 100%)',
          boxShadow: '0 0 10px rgba(255,51,102,0.5)',
        }} 
      />
    </div>
  );
}

// Kill Feed Component
function KillFeed({ kills }: { kills: KillFeedEntry[] }) {
  return (
    <div className="absolute top-16 right-5 flex flex-col gap-1">
      {kills.slice(-5).map((kill, i) => (
        <div
          key={kill.id}
          className="font-pixel text-xs px-3 py-1.5 rounded animate-slideIn"
          style={{
            background: 'rgba(0,0,0,0.8)',
            color: COLORS.text,
            opacity: 1 - i * 0.15,
          }}
        >
          <span style={{ color: kill.killerColor }}>{kill.killer}</span>
          {' '}💀{' '}
          <span style={{ color: kill.victimColor }}>{kill.victim}</span>
        </div>
      ))}
    </div>
  );
}

// Countdown Overlay
function CountdownOverlay({ count }: { count: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
      <div 
        className="font-pixel text-9xl animate-pulse"
        style={{
          color: COLORS.accent,
          textShadow: `0 0 40px ${COLORS.accent}, 0 0 80px ${COLORS.accent}`,
        }}
      >
        {count > 0 ? count : 'GO!'}
      </div>
    </div>
  );
}

// Settings Modal
function SettingsModal({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  settings: GameSettings; 
  onSettingsChange: (settings: GameSettings) => void;
}) {
  const t = translations[settings.language];
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div 
        className="rounded-xl p-8 min-w-[300px] font-pixel"
        style={{ background: COLORS.bgGradient, border: `2px solid ${COLORS.primary}` }}
      >
        <h2 className="text-center text-sm mb-6" style={{ color: COLORS.accent }}>
          ⚙️ {t.settings}
        </h2>
        
        <div className="mb-5">
          <label className="block text-xs mb-2" style={{ color: COLORS.text }}>{t.masterVolume}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.masterVolume}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onSettingsChange({ ...settings, masterVolume: value });
              audioManager.setMasterVolume(value / 100);
            }}
            className="w-full"
          />
        </div>
        
        <div className="mb-5">
          <label className="block text-xs mb-2" style={{ color: COLORS.text }}>{t.musicVolume}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.musicVolume}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onSettingsChange({ ...settings, musicVolume: value });
              audioManager.setMusicVolume(value / 100);
            }}
            className="w-full"
          />
        </div>
        
        <div className="mb-5">
          <label className="block text-xs mb-2" style={{ color: COLORS.text }}>{t.sfxVolume}</label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.sfxVolume}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              onSettingsChange({ ...settings, sfxVolume: value });
              audioManager.setSfxVolume(value / 100);
            }}
            className="w-full"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-xs mb-2" style={{ color: COLORS.text }}>{t.language}</label>
          <select
            value={settings.language}
            onChange={(e) => onSettingsChange({ ...settings, language: e.target.value as 'en' | 'id' })}
            className="w-full p-2 rounded font-pixel text-xs"
            style={{ background: COLORS.bg, color: COLORS.text, border: `1px solid ${COLORS.secondary}` }}
          >
            <option value="en">ENGLISH</option>
            <option value="id">BAHASA INDONESIA</option>
          </select>
        </div>
        
        <button
          onClick={() => {
            audioManager.playSound('menuConfirm');
            onClose();
          }}
          className="w-full py-3 rounded font-pixel text-xs text-white cursor-pointer"
          style={{ background: COLORS.primary }}
        >
          {t.close}
        </button>
      </div>
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
  screenShake 
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
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    const shakeX = screenShake?.offsetX || 0;
    const shakeY = screenShake?.offsetY || 0;
    
    // Clear
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, width, height);
    
    // Draw starfield
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137 + camera.x * 0.1) % width;
      const y = (i * 89) % (height * 0.6);
      const size = (i % 3) + 1;
      ctx.globalAlpha = 0.3 + (i % 5) * 0.1;
      ctx.fillRect(x, y, size, size);
    }
    ctx.globalAlpha = 1;
    
    // Calculate visible tiles
    const startX = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 1);
    const endX = Math.min(WORLD_WIDTH, Math.ceil((camera.x + width / camera.zoom) / TILE_SIZE) + 1);
    const startY = Math.max(0, Math.floor(camera.y / TILE_SIZE) - 1);
    const endY = Math.min(WORLD_HEIGHT, Math.ceil((camera.y + height / camera.zoom) / TILE_SIZE) + 1);
    
    ctx.save();
    ctx.translate(shakeX, shakeY);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);
    
    // Draw world tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const block = world[y]?.[x];
        if (block === BLOCKS.AIR) continue;
        
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        if (block === BLOCKS.DIRT) {
          ctx.fillStyle = COLORS.ground;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.groundLight;
          ctx.fillRect(px + 2, py + 2, 4, 4);
          ctx.fillRect(px + 10, py + 8, 3, 3);
        } else if (block === BLOCKS.STONE) {
          ctx.fillStyle = COLORS.stone;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = COLORS.stoneLight;
          ctx.fillRect(px + 1, py + 1, 6, 2);
          ctx.fillRect(px + 9, py + 6, 5, 2);
        } else if (block === BLOCKS.CHEST) {
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(px + 2, py + 4, 12, 10);
          ctx.fillStyle = COLORS.chest;
          ctx.fillRect(px + 6, py + 6, 4, 4);
        }
      }
    }
    
    // Draw players
    players.forEach(player => {
      if (player.isDead) return;
      if (player.invulnerable > 0 && Math.floor(player.invulnerable / 3) % 2 === 0) return;
      
      const sprite = player.isAttacking ? SPRITE_PATTERNS.attack : 
                    player.isJumping ? SPRITE_PATTERNS.jump : SPRITE_PATTERNS.idle;
      
      ctx.save();
      ctx.translate(player.x, player.y);
      if (player.facing < 0) {
        ctx.scale(-1, 1);
        ctx.translate(-16, 0);
      }
      
      sprite.forEach((row, sy) => {
        for (let sx = 0; sx < row.length; sx++) {
          if (row[sx] === '█') {
            ctx.fillStyle = player.color;
            ctx.fillRect(sx * 2, sy * 2, 2, 2);
          }
        }
      });
      
      ctx.restore();
      
      // Name tag
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(player.x - 15, player.y - 14, 46, 10);
      ctx.fillStyle = player.color;
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(player.name.substring(0, 6), player.x + 8, player.y - 6);
      
      // Health bar
      ctx.fillStyle = '#300';
      ctx.fillRect(player.x - 7, player.y - 22, 30, 4);
      ctx.fillStyle = player.health > 30 ? '#0f0' : '#f00';
      ctx.fillRect(player.x - 7, player.y - 22, (player.health / player.maxHealth) * 30, 4);
    });
    
    // Draw particles
    particles?.draw(ctx, { x: 0, y: 0, zoom: 1 });
    
    // Draw zone fog
    if (zone.radius < WORLD_WIDTH * TILE_SIZE / 2) {
      ctx.fillStyle = COLORS.fog;
      ctx.fillRect(0, 0, zone.x - zone.radius, WORLD_HEIGHT * TILE_SIZE);
      ctx.fillRect(zone.x + zone.radius, 0, WORLD_WIDTH * TILE_SIZE, WORLD_HEIGHT * TILE_SIZE);
      ctx.fillRect(zone.x - zone.radius, 0, zone.radius * 2, zone.y - zone.radius);
      ctx.fillRect(zone.x - zone.radius, zone.y + zone.radius, zone.radius * 2, WORLD_HEIGHT * TILE_SIZE);
    }
    
    ctx.restore();
    
  }, [world, players, zone, camera, particles, screenShake]);
  
  return (
    <canvas
      ref={canvasRef}
      width={isHost ? 1200 : 400}
      height={isHost ? 700 : 300}
      className="w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

export default function PixelClashGame() {
  const [viewMode, setViewMode] = useState<'menu' | 'host' | 'player'>('menu');
  const [gameCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [playerName, setPlayerName] = useState('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  
  const [settings, setSettings] = useState<GameSettings>({
    masterVolume: 70,
    musicVolume: 30,
    sfxVolume: 80,
    language: 'en',
  });
  
  const particlesRef = useRef(new ParticleSystem());
  const screenShakeRef = useRef(new ScreenShake());
  
  const [gameState, setGameState] = useState<GameState>(() => ({
    phase: 'lobby',
    world: generateWorld(Date.now()),
    players: [],
    zone: {
      x: (WORLD_WIDTH * TILE_SIZE) / 2,
      y: (WORLD_HEIGHT * TILE_SIZE) / 2,
      radius: WORLD_WIDTH * TILE_SIZE,
    },
    camera: { x: 0, y: WORLD_HEIGHT * TILE_SIZE * 0.3, zoom: 1 },
    gameCode,
    countdown: null,
  }));
  
  const t = translations[settings.language];
  
  const initAudio = useCallback(async () => {
    if (!audioInitialized) {
      await audioManager.init();
      setAudioInitialized(true);
    }
  }, [audioInitialized]);
  
  const addBotPlayer = useCallback(() => {
    const botNames = ['PixelNinja', 'BlockMstr', 'ZoneRun', 'LootKing', 'Crusher', 'Fighter'];
    setGameState(prev => {
      if (prev.players.length >= MAX_PLAYERS) return prev;
      const id = `bot_${Date.now()}_${Math.random()}`;
      const spawnX = 100 + Math.random() * (WORLD_WIDTH * TILE_SIZE - 200);
      const newPlayer = createPlayer(id, botNames[prev.players.length % botNames.length], PLAYER_COLORS[prev.players.length % PLAYER_COLORS.length], spawnX, 50);
      return { ...prev, players: [...prev.players, newPlayer] };
    });
  }, []);
  
  const joinAsPlayer = useCallback(() => {
    if (!playerName.trim()) return;
    initAudio();
    audioManager.playSound('menuConfirm');
    
    const id = `player_${Date.now()}`;
    setCurrentPlayerId(id);
    
    setGameState(prev => {
      const spawnX = 100 + Math.random() * (WORLD_WIDTH * TILE_SIZE - 200);
      const newPlayer = createPlayer(id, playerName, PLAYER_COLORS[prev.players.length % PLAYER_COLORS.length], spawnX, 50);
      return { ...prev, players: [...prev.players, newPlayer] };
    });
    
    setViewMode('player');
  }, [playerName, initAudio]);
  
  const handlePlayerInput = useCallback((input: { type: string; x?: number; y?: number; slot?: number }) => {
    if (!currentPlayerId) return;
    
    setGameState(prev => {
      const playerIndex = prev.players.findIndex(p => p.id === currentPlayerId);
      if (playerIndex === -1) return prev;
      
      const players = [...prev.players];
      const player = { ...players[playerIndex] };
      
      switch (input.type) {
        case 'move':
          player.vx = (input.x || 0) * MOVE_SPEED;
          if (input.x && input.x !== 0) player.facing = input.x > 0 ? 1 : -1;
          break;
        case 'jump':
          if (!player.isJumping) {
            player.vy = JUMP_FORCE;
            player.isJumping = true;
            audioManager.playSound('jump');
            particlesRef.current.jump(player.x, player.y);
          }
          break;
        case 'action':
          player.isAttacking = true;
          audioManager.playSound('attack');
          setTimeout(() => {
            setGameState(p => ({
              ...p,
              players: p.players.map(pl => pl.id === currentPlayerId ? { ...pl, isAttacking: false } : pl),
            }));
          }, 200);
          break;
        case 'selectSlot':
          player.selectedSlot = input.slot || 0;
          audioManager.playSound('menuSelect');
          break;
      }
      
      players[playerIndex] = player;
      return { ...prev, players };
    });
  }, [currentPlayerId]);
  
  const startGame = useCallback(async () => {
    await initAudio();
    audioManager.playSound('menuConfirm');
    
    setGameState(prev => ({ ...prev, phase: 'countdown', countdown: 3 }));
    
    for (let i = 3; i >= 0; i--) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      audioManager.playSound(i > 0 ? 'countdown' : 'gameStart');
      setGameState(prev => ({ ...prev, countdown: i }));
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setGameState(prev => ({ ...prev, phase: 'playing', countdown: null }));
    audioManager.startMusic('battle');
  }, [initAudio]);
  
  // Game loop
  useEffect(() => {
    if (gameState.phase !== 'playing') return;
    
    const interval = setInterval(() => {
      particlesRef.current.update();
      screenShakeRef.current.update();
      
      setGameState(prev => {
        let { players, world, zone, camera } = prev;
        
        players = players.map(player => {
          if (player.isDead) return player;
          
          let { x, y, vx, vy, isJumping, health, invulnerable } = player;
          
          vy += GRAVITY;
          x += vx;
          y += vy;
          
          const tileX = Math.floor(x / TILE_SIZE);
          const tileY = Math.floor((y + 16) / TILE_SIZE);
          
          if (world[tileY]?.[tileX] && world[tileY][tileX] !== BLOCKS.AIR && world[tileY][tileX] !== BLOCKS.CHEST) {
            y = tileY * TILE_SIZE - 16;
            vy = 0;
            isJumping = false;
          }
          
          x = Math.max(0, Math.min(x, WORLD_WIDTH * TILE_SIZE - 16));
          y = Math.max(0, Math.min(y, WORLD_HEIGHT * TILE_SIZE - 16));
          
          const distFromCenter = Math.sqrt(Math.pow(x - zone.x, 2) + Math.pow(y - zone.y, 2));
          if (distFromCenter > zone.radius && invulnerable <= 0) {
            health = Math.max(0, health - 0.5);
          }
          
          if (invulnerable > 0) invulnerable--;
          
          const isDead = health <= 0;
          if (isDead && !player.isDead) {
            audioManager.playSound('death');
            particlesRef.current.death(x, y, player.color);
            screenShakeRef.current.shake(15, 20);
          }
          
          return { ...player, x, y, vx: vx * 0.9, vy, isJumping, health, isDead, invulnerable };
        });
        
        // Combat
        players.forEach((attacker, i) => {
          if (!attacker.isAttacking || attacker.isDead) return;
          const weapon = attacker.inventory[attacker.selectedSlot]?.item || WEAPONS.FIST;
          
          players.forEach((target, j) => {
            if (i === j || target.isDead || target.invulnerable > 0) return;
            
            const dx = target.x - attacker.x;
            const dy = target.y - attacker.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < (weapon as any).range && ((attacker.facing > 0 && dx > 0) || (attacker.facing < 0 && dx < 0))) {
              target.health -= (weapon as any).damage;
              target.invulnerable = 30;
              target.vx += attacker.facing * 5;
              target.vy = -3;
              
              audioManager.playSound('hit');
              particlesRef.current.hit(target.x + 8, target.y + 8);
              screenShakeRef.current.shake(8, 10);
              
              if (target.health <= 0 && !target.isDead) {
                target.isDead = true;
                attacker.kills++;
                setKillFeed(prev => [...prev.slice(-4), {
                  id: Date.now(),
                  killer: attacker.name,
                  killerColor: attacker.color,
                  victim: target.name,
                  victimColor: target.color,
                }]);
              }
            }
          });
        });
        
        const newRadius = Math.max(100, zone.radius - 0.2);
        
        // Bot AI
        players = players.map(player => {
          if (player.isDead || !player.id.startsWith('bot_')) return player;
          if (Math.random() < 0.02) {
            player.vx = (Math.random() - 0.5) * MOVE_SPEED * 2;
            player.facing = player.vx > 0 ? 1 : -1;
          }
          if (Math.random() < 0.03 && !player.isJumping) {
            player.vy = JUMP_FORCE;
            player.isJumping = true;
          }
          return player;
        });
        
        // Camera
        const alivePlayers = players.filter(p => !p.isDead);
        if (alivePlayers.length > 0) {
          const minX = Math.min(...alivePlayers.map(p => p.x));
          const maxX = Math.max(...alivePlayers.map(p => p.x));
          const minY = Math.min(...alivePlayers.map(p => p.y));
          const maxY = Math.max(...alivePlayers.map(p => p.y));
          
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
        
        if (alivePlayers.length <= 1 && players.length > 1) {
          audioManager.stopMusic();
          if (alivePlayers.length === 1) audioManager.playSound('victory');
          return { ...prev, players, zone: { ...zone, radius: newRadius }, camera, phase: 'gameover' };
        }
        
        return { ...prev, players, zone: { ...zone, radius: newRadius }, camera };
      });
    }, 1000 / 60);
    
    return () => clearInterval(interval);
  }, [gameState.phase]);
  
  const currentPlayer = gameState.players.find(p => p.id === currentPlayerId);
  const alivePlayers = gameState.players.filter(p => !p.isDead);
  const winner = gameState.phase === 'gameover' && alivePlayers.length === 1 ? alivePlayers[0] : null;

  // MENU VIEW
  if (viewMode === 'menu') {
    return (
      <div 
        onClick={initAudio}
        className="w-full min-h-screen flex flex-col items-center justify-center p-5 gap-8 font-pixel"
        style={{ background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bgGradient} 100%)` }}
      >
        <button
          onClick={(e) => { e.stopPropagation(); initAudio(); audioManager.playSound('menuSelect'); setShowSettings(true); }}
          className="absolute top-5 right-5 px-3 py-2 rounded-lg text-xs cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.1)', border: `1px solid ${COLORS.textDim}`, color: COLORS.text }}
        >⚙️</button>
        
        <div className="text-center">
          <h1 className="text-3xl md:text-5xl m-0" style={{ color: COLORS.primary, textShadow: `0 0 20px ${COLORS.primary}, 4px 4px 0 ${COLORS.warning}` }}>{t.title}</h1>
          <p className="text-xs md:text-sm mt-2" style={{ color: COLORS.secondary, textShadow: `0 0 10px ${COLORS.secondary}` }}>{t.subtitle}</p>
        </div>
        
        <div className="w-16 h-16 flex flex-wrap animate-float">
          {SPRITE_PATTERNS.idle.map((row, y) => row.split('').map((char, x) => (
            <div key={`${x}-${y}`} style={{ width: 8, height: 8, background: char === '█' ? COLORS.primary : 'transparent', boxShadow: char === '█' ? `0 0 4px ${COLORS.primary}` : 'none' }} />
          )))}
        </div>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => { initAudio(); audioManager.playSound('menuConfirm'); for(let i=0;i<4;i++) addBotPlayer(); setViewMode('host'); }}
            className="py-4 px-8 text-sm rounded-lg text-white cursor-pointer transition-transform hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.warning} 100%)`, boxShadow: `0 4px 0 #aa2244, 0 0 30px ${COLORS.primary}40` }}
          >🖥️ {t.hostGame}</button>
          
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t.yourName}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              maxLength={8}
              className="flex-1 px-4 py-3 rounded-lg text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.1)', border: `2px solid ${COLORS.secondary}40`, color: COLORS.text }}
            />
            <button
              onClick={joinAsPlayer}
              disabled={!playerName.trim()}
              className="px-5 py-3 rounded-lg text-xs cursor-pointer disabled:cursor-not-allowed"
              style={{ 
                background: playerName.trim() ? `linear-gradient(135deg, ${COLORS.secondary} 0%, #00aa88 100%)` : 'rgba(255,255,255,0.1)',
                color: playerName.trim() ? '#000' : COLORS.textDim,
              }}
            >📱 {t.join}</button>
          </div>
        </div>
        
        <div className="text-center text-xs leading-8" style={{ color: COLORS.textDim }}>
          <p>{t.hostDisplay}</p>
          <p>{t.joinPhone}</p>
          <p>{t.lastStanding}</p>
        </div>
        
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} settings={settings} onSettingsChange={setSettings} />
      </div>
    );
  }
  
  // HOST VIEW
  if (viewMode === 'host') {
    return (
      <div className="w-full h-screen flex flex-col font-pixel overflow-hidden" style={{ background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bgGradient} 100%)` }}>
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3" style={{ background: 'rgba(0,0,0,0.5)', borderBottom: `2px solid ${COLORS.primary}` }}>
          <div className="flex items-center gap-5">
            <h1 className="text-lg m-0" style={{ color: COLORS.primary, textShadow: `0 0 20px ${COLORS.primary}` }}>{t.title}</h1>
            <div className="text-xs px-3 py-1 rounded" style={{ color: COLORS.secondary, background: 'rgba(0,255,204,0.1)', border: `1px solid ${COLORS.secondary}` }}>
              {gameState.phase === 'lobby' ? `⏳ ${t.lobby}` : gameState.phase === 'playing' || gameState.phase === 'countdown' ? `🎮 ${t.battle}` : `🏆 ${t.gameOver}`}
            </div>
          </div>
          <div className="flex items-center gap-8">
            <span className="text-xs" style={{ color: COLORS.text }}>{t.alive}: <span style={{ color: COLORS.secondary }}>{alivePlayers.length}</span>/{gameState.players.length}</span>
            {gameState.zone.radius < WORLD_WIDTH * TILE_SIZE / 2 && <span className="text-xs animate-pulse" style={{ color: COLORS.warning }}>⚠️ {t.zoneShrinking}</span>}
          </div>
        </div>
        
        {/* Main */}
        <div className="flex-1 flex relative">
          <div className="flex-1 flex items-center justify-center p-5 relative">
            <div className="w-full h-full max-w-[1200px] rounded-lg overflow-hidden relative" style={{ border: `3px solid ${COLORS.primary}`, boxShadow: `0 0 40px ${COLORS.primary}40` }}>
              {gameState.phase === 'lobby' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-8" style={{ background: 'rgba(0,0,0,0.8)' }}>
                  <h2 className="text-2xl" style={{ color: COLORS.accent, textShadow: `0 0 20px ${COLORS.accent}` }}>{t.scanToJoin}</h2>
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG value={`https://pixel-clash.vercel.app/join/${gameCode}`} size={180} />
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textDim }}>{t.gameCode}: <span style={{ color: COLORS.secondary }}>{gameCode}</span></p>
                  <p className="text-sm" style={{ color: COLORS.text }}>{gameState.players.length} {t.playersWaiting}</p>
                  {gameState.players.length >= 2 && (
                    <button onClick={startGame} className="px-10 py-4 text-sm rounded-lg text-white cursor-pointer hover:scale-105 transition-transform" style={{ background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.warning} 100%)`, boxShadow: `0 0 30px ${COLORS.primary}60` }}>{t.startBattle}</button>
                  )}
                </div>
              ) : (
                <GameCanvas world={gameState.world} players={gameState.players} zone={gameState.zone} camera={gameState.camera} isHost={true} particles={particlesRef.current} screenShake={screenShakeRef.current} />
              )}
              
              {gameState.phase === 'countdown' && gameState.countdown !== null && <CountdownOverlay count={gameState.countdown} />}
              
              {gameState.phase === 'gameover' && winner && (
                <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
                  <div className="text-5xl mb-5">🏆</div>
                  <div className="text-2xl mb-3" style={{ color: COLORS.accent }}>{t.victory}</div>
                  <div className="text-lg" style={{ color: winner.color }}>{winner.name}</div>
                  <div className="text-sm mt-2" style={{ color: COLORS.text }}>{winner.kills} {t.kills}</div>
                </div>
              )}
            </div>
            
            {(gameState.phase === 'playing' || gameState.phase === 'gameover') && <KillFeed kills={killFeed} />}
          </div>
          
          {/* Leaderboard */}
          <div className="w-64 p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.6)', borderLeft: `2px solid ${COLORS.primary}40` }}>
            <h3 className="text-xs mb-4 tracking-widest" style={{ color: COLORS.accent }}>{t.leaderboard}</h3>
            {[...gameState.players].sort((a, b) => b.kills - a.kills || (a.isDead ? 1 : -1)).map((player, i) => (
              <div key={player.id} className="flex items-center gap-2 px-2 py-2 mb-1 rounded" style={{ background: player.isDead ? 'rgba(100,0,0,0.3)' : 'rgba(255,255,255,0.05)', border: `1px solid ${player.color}40`, opacity: player.isDead ? 0.5 : 1 }}>
                <span className="text-xs w-5" style={{ color: COLORS.accent }}>#{i + 1}</span>
                <div className="w-3 h-3 rounded-sm" style={{ background: player.color }} />
                <span className="text-xs flex-1" style={{ color: COLORS.text, textDecoration: player.isDead ? 'line-through' : 'none' }}>{player.name}</span>
                <span className="text-xs" style={{ color: COLORS.secondary }}>{player.kills} 💀</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // PLAYER VIEW
  if (viewMode === 'player') {
    const playerCamera = currentPlayer ? { x: currentPlayer.x - 200, y: currentPlayer.y - 150, zoom: 2 } : { x: 0, y: 0, zoom: 2 };
    
    if (!currentPlayer) {
      return <div className="w-full h-screen flex items-center justify-center font-pixel" style={{ background: COLORS.bg }}><div className="text-center" style={{ color: COLORS.text }}><div className="text-2xl mb-5">⏳</div>{t.connecting}</div></div>;
    }
    
    if (currentPlayer.isDead) {
      return <div className="w-full h-screen flex flex-col items-center justify-center gap-5 font-pixel" style={{ background: COLORS.bg }}><div className="text-5xl">💀</div><div className="text-base" style={{ color: COLORS.primary }}>{t.eliminated}</div><div className="text-xs" style={{ color: COLORS.textDim }}>{t.youPlaced} #{alivePlayers.length + 1}</div><div className="text-xs" style={{ color: COLORS.accent }}>{currentPlayer.kills} {t.kills}</div></div>;
    }
    
    return (
      <div className="w-full h-screen flex flex-col font-pixel overflow-hidden select-none" style={{ background: COLORS.bg, touchAction: 'none' }}>
        <div className="flex-1 relative" style={{ borderBottom: `2px solid ${COLORS.primary}40` }}>
          <GameCanvas world={gameState.world} players={gameState.players} zone={gameState.zone} camera={playerCamera} isHost={false} />
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
            <div className="w-28"><div className="text-xs mb-1" style={{ color: COLORS.textDim }}>{t.health}</div><HealthBar health={currentPlayer.health} maxHealth={currentPlayer.maxHealth} /></div>
            <div className="px-2 py-1 rounded text-xs" style={{ background: 'rgba(0,0,0,0.7)', color: COLORS.accent }}>{currentPlayer.kills} 💀</div>
          </div>
          {gameState.zone.radius < WORLD_WIDTH * TILE_SIZE / 2 && <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded text-xs animate-pulse" style={{ background: 'rgba(255,102,0,0.8)', color: '#fff' }}>⚠️ {t.zoneClosing}</div>}
        </div>
        
        <div className="h-48 flex flex-col p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
          <div className="flex gap-2 justify-center mb-4 overflow-x-auto pb-1">
            {currentPlayer.inventory.map((item, i) => <InventorySlot key={i} item={item} isSelected={i === currentPlayer.selectedSlot} onClick={() => handlePlayerInput({ type: 'selectSlot', slot: i })} />)}
          </div>
          <div className="flex-1 flex justify-between items-center px-5">
            <VirtualJoystick onMove={(pos) => handlePlayerInput({ type: 'move', x: pos.x, y: pos.y })} size={100} />
            <div className="flex gap-4">
              <ActionButton label="B" color={COLORS.warning} onPress={() => handlePlayerInput({ type: 'action' })} size={60} />
              <ActionButton label="A" color={COLORS.secondary} onPress={() => handlePlayerInput({ type: 'jump' })} size={60} />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
}
