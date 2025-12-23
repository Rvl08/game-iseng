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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameStateSchema = exports.ZoneSchema = exports.PlayerSchema = void 0;
var schema_1 = require("@colyseus/schema");
var PlayerSchema = /** @class */ (function (_super) {
    __extends(PlayerSchema, _super);
    function PlayerSchema() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = "";
        _this.name = "";
        _this.color = "#ff3366";
        _this.x = 0;
        _this.y = 0;
        _this.vx = 0;
        _this.vy = 0;
        _this.health = 100;
        _this.maxHealth = 100;
        _this.facing = 1;
        _this.isJumping = false;
        _this.isAttacking = false;
        _this.isDead = false;
        _this.kills = 0;
        _this.blocks = 10;
        _this.selectedSlot = 0;
        _this.invulnerable = 0;
        _this.inventory = "[]"; // JSON string of inventory
        return _this;
    }
    __decorate([
        (0, schema_1.type)("string"),
        __metadata("design:type", String)
    ], PlayerSchema.prototype, "id", void 0);
    __decorate([
        (0, schema_1.type)("string"),
        __metadata("design:type", String)
    ], PlayerSchema.prototype, "name", void 0);
    __decorate([
        (0, schema_1.type)("string"),
        __metadata("design:type", String)
    ], PlayerSchema.prototype, "color", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "x", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "y", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "vx", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "vy", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "health", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "maxHealth", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "facing", void 0);
    __decorate([
        (0, schema_1.type)("boolean"),
        __metadata("design:type", Boolean)
    ], PlayerSchema.prototype, "isJumping", void 0);
    __decorate([
        (0, schema_1.type)("boolean"),
        __metadata("design:type", Boolean)
    ], PlayerSchema.prototype, "isAttacking", void 0);
    __decorate([
        (0, schema_1.type)("boolean"),
        __metadata("design:type", Boolean)
    ], PlayerSchema.prototype, "isDead", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "kills", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "blocks", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "selectedSlot", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], PlayerSchema.prototype, "invulnerable", void 0);
    __decorate([
        (0, schema_1.type)("string"),
        __metadata("design:type", String)
    ], PlayerSchema.prototype, "inventory", void 0);
    return PlayerSchema;
}(schema_1.Schema));
exports.PlayerSchema = PlayerSchema;
var ZoneSchema = /** @class */ (function (_super) {
    __extends(ZoneSchema, _super);
    function ZoneSchema() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.x = 0;
        _this.y = 0;
        _this.radius = 1000;
        return _this;
    }
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], ZoneSchema.prototype, "x", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], ZoneSchema.prototype, "y", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], ZoneSchema.prototype, "radius", void 0);
    return ZoneSchema;
}(schema_1.Schema));
exports.ZoneSchema = ZoneSchema;
var GameStateSchema = /** @class */ (function (_super) {
    __extends(GameStateSchema, _super);
    function GameStateSchema() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.phase = "lobby";
        _this.players = new schema_1.MapSchema();
        _this.zone = new ZoneSchema();
        _this.worldSeed = Date.now();
        _this.countdown = 0;
        return _this;
    }
    __decorate([
        (0, schema_1.type)("string"),
        __metadata("design:type", String)
    ], GameStateSchema.prototype, "phase", void 0);
    __decorate([
        (0, schema_1.type)({ map: PlayerSchema }),
        __metadata("design:type", Object)
    ], GameStateSchema.prototype, "players", void 0);
    __decorate([
        (0, schema_1.type)(ZoneSchema),
        __metadata("design:type", Object)
    ], GameStateSchema.prototype, "zone", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], GameStateSchema.prototype, "worldSeed", void 0);
    __decorate([
        (0, schema_1.type)("number"),
        __metadata("design:type", Number)
    ], GameStateSchema.prototype, "countdown", void 0);
    return GameStateSchema;
}(schema_1.Schema));
exports.GameStateSchema = GameStateSchema;
