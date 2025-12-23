import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class PlayerSchema extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") color: string = "#ff3366";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") vx: number = 0;
  @type("number") vy: number = 0;
  @type("number") health: number = 100;
  @type("number") maxHealth: number = 100;
  @type("number") facing: number = 1;
  @type("boolean") isJumping: boolean = false;
  @type("boolean") isAttacking: boolean = false;
  @type("boolean") isDead: boolean = false;
  @type("number") kills: number = 0;
  @type("number") blocks: number = 10;
  @type("number") selectedSlot: number = 0;
  @type("number") invulnerable: number = 0;
  @type("string") inventory: string = "[]"; // JSON string of inventory
}

export class ZoneSchema extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") radius: number = 1000;
}

export class GameStateSchema extends Schema {
  @type("string") phase: string = "lobby";
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type(ZoneSchema) zone = new ZoneSchema();
  @type("number") worldSeed: number = Date.now();
  @type("number") countdown: number = 0;
}
