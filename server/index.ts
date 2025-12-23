import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { GameRoom } from "./rooms/GameRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

const httpServer = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: httpServer,
  }),
});

// Register your room handlers
gameServer.define("game_room", GameRoom);

// Start the HTTP server (Colyseus will automatically attach)
httpServer.listen(port, () => {
  console.log(`
       ___      _
      / __\___ | |_   _ ___  ___ _   _ ___
     / /  / _ \\| | | | / __|/ _ \\ | | / __|
    / /__| (_) | | |_| \\__ \\  __/ |_| \\__ \\
    \\____/\\___/|_|\\__, |___/\\___|\\__,_|___/
                  |___/
  `);
  console.log(`✅ Colyseus server listening on ws://localhost:${port}`);
  console.log(`✅ Health check available at http://localhost:${port}/health`);
});
