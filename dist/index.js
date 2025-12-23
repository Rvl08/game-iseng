"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@colyseus/core");
var ws_transport_1 = require("@colyseus/ws-transport");
var http_1 = require("http");
var express_1 = __importDefault(require("express"));
var cors_1 = __importDefault(require("cors"));
var GameRoom_1 = require("./rooms/GameRoom");
var port = Number(process.env.PORT || 2567);
var app = (0, express_1.default)();
// Enable CORS
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get("/health", function (req, res) {
    res.json({ status: "ok", timestamp: Date.now() });
});
var httpServer = (0, http_1.createServer)(app);
var gameServer = new core_1.Server({
    transport: new ws_transport_1.WebSocketTransport({
        server: httpServer,
    }),
});
// Register your room handlers
gameServer.define("game_room", GameRoom_1.GameRoom);
// Start the HTTP server (Colyseus will automatically attach)
httpServer.listen(port, function () {
    console.log("\n       ___      _\n      / _____ | |_   _ ___  ___ _   _ ___\n     / /  / _ \\| | | | / __|/ _ \\ | | / __|\n    / /__| (_) | | |_| \\__ \\  __/ |_| \\__ \\\n    \\____/\\___/|_|\\__, |___/\\___|\\__,_|___/\n                  |___/\n  ");
    console.log("\u2705 Colyseus server listening on ws://localhost:".concat(port));
    console.log("\u2705 Health check available at http://localhost:".concat(port, "/health"));
});
