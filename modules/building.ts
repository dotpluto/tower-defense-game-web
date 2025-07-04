import { loadTexture } from "./assetManagement.js";
import { Resources } from "./currency.js";
import { Enemy } from "./enemy.js";
import { Entity, EntityType, EntityTypeArgs } from "./entity.js";
import { Game } from "./game.js";
import { Viewport } from "./graphics.js";
import { Vec2 } from "./vector2.js";

export interface BuildingTypeArgs extends EntityTypeArgs {
    cost: Resources;
    generation: Resources;
}

export class BuildingType extends EntityType {
    static HQ_TEXT = loadTexture("hq.png");
    static SOLAR_TEXT = loadTexture("solar_farm.png");
    static MINE_TEXT_EMPTY = loadTexture("quarry.png");
    static MINE_TEXT_FULL = loadTexture("quarry_mining.png");

    cost: Resources;
    generation: Resources;

    static HQ = new BuildingType({
        size: new Vec2(40, 40),
        doCollision: true,
        hasHealth: true,
        maxHealth: 100,
        cost: new Resources({}),
        generation: new Resources({ nilrun: 0.01, energy: 0.01 }),
    });

    static SOLAR = new BuildingType({
        size: new Vec2(50, 50),
        doCollision: true,
        hasHealth: false,
        maxHealth: 100,
        cost: new Resources({ energy: 10, nilrun: 15 }),
        generation: new Resources({ energy: 0.01 }),
    });

    static MINE = new BuildingType({
        size: new Vec2(10, 10),
        doCollision: true,
        hasHealth: true,
        maxHealth: 50,
        cost: new Resources({}),
        generation: new Resources({ nilrun: 0.01 }),
    });

    constructor(args: BuildingTypeArgs) {
        super(args);
        this.cost = args.cost;
        this.generation = args.generation;
    }

    doCollisionResults() { }
}

export class Building
    extends Entity<BuildingType> {
    static hurtCooldownMax = 5;
    public hurtCooldown: number = 0;

    static createDefault(): Building {
        return new Building(0, 0, true, BuildingType.HQ, 0);
    }

    public eType: BuildingType;

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        eType: BuildingType,
        health: number,
    ) {
        super(x, y, isCenter, eType, health);
        this.eType = eType;
    }

    drawHealth(view: Viewport) {
        if (this.eType.hasHealth) {
            const gapY = 4;
            const thickness = 3;

            const offX = this.pos.x;
            const offY = this.pos.y + this.eType.size.x + gapY;
            const healthSize = (this.health / this.eType.maxHealth) * this.eType.size.x;

            view.fillRect(offX, offY, healthSize, thickness, "red");
        }
    }

    injectData(
        x: number,
        y: number,
        isCenter: boolean,
        eType: BuildingType,
        health: number,
    ) {
        this.injectEntityData(x, y, isCenter, eType, health);
    }

    draw(view: Viewport) {
        switch (this.eType) {
            case BuildingType.SOLAR:
		view.drawImage(BuildingType.SOLAR_TEXT, this.pos.x, this.pos.y);
                this.drawHealth(view);
                break;
            case BuildingType.HQ:
		view.drawImage(BuildingType.HQ_TEXT, this.pos.x, this.pos.y);
                this.drawHealth(view);
                break;
            case BuildingType.MINE:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "grey");
                this.drawHealth(view);
                break;
            default:
                throw new Error("Tried to draw a building that doesn't exist.");
        }
    }

    update(): void {
        this.hurtCooldown -= 1;
        switch (this.eType) {
            case BuildingType.MINE:
                break;
            default:
                Game.level!.currency.resourc.add(this.eType.generation);
                break;
        }
    }

    doCollisionResults(e: Entity<any>): void {
        if (e instanceof Enemy) {
            if (this.hurtCooldown <= 0) {
                this.hurtCooldown = Building.hurtCooldownMax;
                if (this.health > 0) {
                    this.health -= 1;
                }
            }
        }
    }
}
