"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameRoom = void 0;
var core_1 = require("@colyseus/core");
var GameState_1 = require("../schema/GameState");
// Constants from game
var TILE_SIZE = 16;
var WORLD_WIDTH = 80;
var WORLD_HEIGHT = 50;
var GRAVITY = 0.5;
var MOVE_SPEED = 3;
var JUMP_FORCE = -10;
var PLAYER_COLORS = [
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
var GameRoom = /** @class */ (function (_super) {
    __extends(GameRoom, _super);
    function GameRoom() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.maxClients = 16;
        _this.gameLoop = null;
        _this.worldData = [];
        return _this;
    }
    GameRoom.prototype.onCreate = function (options) {
        var _this = this;
        this.setState(new GameState_1.GameStateSchema());
        // Initialize zone
        this.state.zone.x = (WORLD_WIDTH * TILE_SIZE) / 2;
        this.state.zone.y = (WORLD_HEIGHT * TILE_SIZE) / 2;
        this.state.zone.radius = WORLD_WIDTH * TILE_SIZE;
        // Generate world seed
        this.state.worldSeed = Date.now();
        // Message handlers
        this.onMessage("move", function (client, message) {
            var player = _this.state.players.get(client.sessionId);
            if (player && !player.isDead) {
                player.vx = message.x * MOVE_SPEED;
                if (message.x !== 0)
                    player.facing = message.x > 0 ? 1 : -1;
            }
        });
        this.onMessage("jump", function (client) {
            var player = _this.state.players.get(client.sessionId);
            if (player && !player.isDead && !player.isJumping) {
                player.vy = JUMP_FORCE;
                player.isJumping = true;
            }
        });
        this.onMessage("action", function (client) {
            var player = _this.state.players.get(client.sessionId);
            if (player && !player.isDead) {
                player.isAttacking = true;
                setTimeout(function () {
                    if (player)
                        player.isAttacking = false;
                }, 200);
            }
        });
        this.onMessage("selectSlot", function (client, message) {
            var player = _this.state.players.get(client.sessionId);
            if (player && !player.isDead) {
                player.selectedSlot = message.slot;
            }
        });
        this.onMessage("startGame", function (client) {
            // Only host can start
            if (_this.state.phase === "lobby" && _this.state.players.size >= 2) {
                _this.startGameCountdown();
            }
        });
        console.log("GameRoom created!", this.roomId);
    };
    GameRoom.prototype.onJoin = function (client, options) {
        console.log(client.sessionId, "joined!");
        var player = new GameState_1.PlayerSchema();
        player.id = client.sessionId;
        player.name = options.playerName || "Player".concat(this.state.players.size + 1);
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
    };
    GameRoom.prototype.onLeave = function (client, consented) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log(client.sessionId, "left!");
                // Remove player
                this.state.players.delete(client.sessionId);
                // If no players left, dispose room
                if (this.state.players.size === 0) {
                    this.disconnect();
                }
                return [2 /*return*/];
            });
        });
    };
    GameRoom.prototype.onDispose = function () {
        console.log("room", this.roomId, "disposing...");
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
    };
    GameRoom.prototype.startGameCountdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            var i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.state.phase = "countdown";
                        i = 3;
                        _a.label = 1;
                    case 1:
                        if (!(i >= 0)) return [3 /*break*/, 4];
                        this.state.countdown = i;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        i--;
                        return [3 /*break*/, 1];
                    case 4:
                        this.state.phase = "playing";
                        this.state.countdown = 0;
                        this.startGameLoop();
                        return [2 /*return*/];
                }
            });
        });
    };
    GameRoom.prototype.startGameLoop = function () {
        var _this = this;
        // Game loop at 60 FPS
        this.gameLoop = setInterval(function () {
            if (_this.state.phase !== "playing")
                return;
            // Update all players
            _this.state.players.forEach(function (player) {
                if (player.isDead)
                    return;
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
                var distToZone = Math.sqrt(Math.pow((player.x - _this.state.zone.x), 2) + Math.pow((player.y - _this.state.zone.y), 2));
                if (distToZone > _this.state.zone.radius && player.invulnerable <= 0) {
                    player.health -= 2;
                    if (player.health <= 0) {
                        player.isDead = true;
                        player.health = 0;
                    }
                }
                // Decrease invulnerability
                if (player.invulnerable > 0)
                    player.invulnerable--;
                // Friction
                player.vx *= 0.8;
            });
            // Shrink zone
            _this.state.zone.radius = Math.max(100, _this.state.zone.radius - 0.2);
            // Check win condition
            var alivePlayers = Array.from(_this.state.players.values()).filter(function (p) { return !p.isDead; });
            if (alivePlayers.length <= 1 && _this.state.players.size > 1) {
                _this.state.phase = "gameover";
                if (_this.gameLoop) {
                    clearInterval(_this.gameLoop);
                    _this.gameLoop = null;
                }
            }
        }, 1000 / 60);
    };
    return GameRoom;
}(core_1.Room));
exports.GameRoom = GameRoom;
