import { Room, Client } from "@colyseus/core";
import { GameStateSchema, PlayerSchema } from "../schema/GameState";

// Constants from game
const TILE_SIZE = 16;
const WORLD_WIDTH = 80;
const WORLD_HEIGHT = 50;
const GRAVITY = 0.5;
const MOVE_SPEED = 3;
const JUMP_FORCE = -10;

const PLAYER_COLORS = [
  "#ff3366",
  "#00ffcc",
  "#ffcc00",
  "#ff6600",
  "#66ff33",
  "#cc33ff",
  "#33ccff",
  "#ff33cc",
  "#ffff33",
  "#33ff99",
  "#9933ff",
  "#ff9933",
  "#33ffff",
  "#ff3399",
  "#99ff33",
  "#3399ff",
];

export class GameRoom extends Room<GameStateSchema> {
  maxClients = 16;
  private gameLoop: NodeJS.Timeout | null = null;
  private worldData: number[][] = [];

  onCreate(options: any) {
    this.setState(new GameStateSchema());

    // Initialize zone
    this.state.zone.x = (WORLD_WIDTH * TILE_SIZE) / 2;
    this.state.zone.y = (WORLD_HEIGHT * TILE_SIZE) / 2;
    this.state.zone.radius = WORLD_WIDTH * TILE_SIZE;

    // Generate world seed
    this.state.worldSeed = Date.now();

    // Message handlers
    this.onMessage("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && !player.isDead) {
        player.vx = message.x * MOVE_SPEED;
        if (message.x !== 0) player.facing = message.x > 0 ? 1 : -1;
      }
    });

    this.onMessage("jump", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player && !player.isDead && !player.isJumping) {
        player.vy = JUMP_FORCE;
        player.isJumping = true;
      }
    });

    this.onMessage("action", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player && !player.isDead) {
        player.isAttacking = true;
        setTimeout(() => {
          if (player) player.isAttacking = false;
        }, 200);
      }
    });

    this.onMessage("selectSlot", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (player && !player.isDead) {
        player.selectedSlot = message.slot;
      }
    });

    this.onMessage("startGame", (client) => {
      // Only host can start
      if (this.state.phase === "lobby" && this.state.players.size >= 2) {
        this.startGameCountdown();
      }
    });

    console.log("GameRoom created!", this.roomId);
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");

    const player = new PlayerSchema();
    player.id = client.sessionId;
    player.name = options.playerName || `Player${this.state.players.size + 1}`;
    player.color = PLAYER_COLORS[this.state.players.size % PLAYER_COLORS.length];

    // Spawn position
    player.x = 100 + Math.random() * (WORLD_WIDTH * TILE_SIZE - 200);
    player.y = 50;

    // Default inventory (serialized)
    player.inventory = JSON.stringify([
      { type: "weapon", item: "FIST" },
      null,
      null,
      null,
      null,
    ]);

    this.state.players.set(client.sessionId, player);
  }

  async onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");

    // Remove player
    this.state.players.delete(client.sessionId);

    // If no players left, dispose room
    if (this.state.players.size === 0) {
      this.disconnect();
    }
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
  }

  private async startGameCountdown() {
    this.state.phase = "countdown";

    for (let i = 3; i >= 0; i--) {
      this.state.countdown = i;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.state.phase = "playing";
    this.state.countdown = 0;
    this.startGameLoop();
  }

  private startGameLoop() {
    // Game loop at 60 FPS
    this.gameLoop = setInterval(() => {
      if (this.state.phase !== "playing") return;

      // Update all players
      this.state.players.forEach((player) => {
        if (player.isDead) return;

        // Apply gravity
        player.vy += GRAVITY;
        player.x += player.vx;
        player.y += player.vy;

        // Simple ground collision (you can improve this with world data)
        if (player.y > WORLD_HEIGHT * TILE_SIZE - 100) {
          player.y = WORLD_HEIGHT * TILE_SIZE - 100;
          player.vy = 0;
          player.isJumping = false;
        }

        // Bounds check
        player.x = Math.max(0, Math.min(WORLD_WIDTH * TILE_SIZE - 16, player.x));
        player.y = Math.max(0, player.y);

        // Zone damage
        const distToZone = Math.sqrt(
          (player.x - this.state.zone.x) ** 2 + (player.y - this.state.zone.y) ** 2
        );
        if (distToZone > this.state.zone.radius && player.invulnerable <= 0) {
          player.health -= 2;
          if (player.health <= 0) {
            player.isDead = true;
            player.health = 0;
          }
        }

        // Decrease invulnerability
        if (player.invulnerable > 0) player.invulnerable--;

        // Friction
        player.vx *= 0.8;
      });

      // Shrink zone
      this.state.zone.radius = Math.max(100, this.state.zone.radius - 0.2);

      // Check win condition
      const alivePlayers = Array.from(this.state.players.values()).filter((p) => !p.isDead);
      if (alivePlayers.length <= 1 && this.state.players.size > 1) {
        this.state.phase = "gameover";
        if (this.gameLoop) {
          clearInterval(this.gameLoop);
          this.gameLoop = null;
        }
      }
    }, 1000 / 60);
  }
}
