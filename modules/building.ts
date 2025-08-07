import { loadTexture } from "./assetManagement.js";
import { Resources } from "./currency.js";
import { Enemy } from "./enemy.js";
import { Entity, EntityType } from "./entity.js";
import { Game } from "./game.js";
import { view, Viewport } from "./graphics.js";
import { ScreenManager } from "./screenManager.js";
import { Vec2 } from "./vector2.js";

export interface BuildingTypeArgs {
    cost: Resources;
    generation: Resources;
    entity_type: EntityType;
}

export class BuildingType {
    static HQ_TEXT = loadTexture("hq.png");
    static SOLAR_TEXT = loadTexture("solar_farm.png");
    static MINE_TEXT_EMPTY = loadTexture("quarry.png");
    static MINE_TEXT_FULL = loadTexture("quarry_mining.png");

    public cost: Resources;
    public generation: Resources;
    public entity_type: EntityType;

    static HQ = new BuildingType({
	entity_type: {
	    id: "building.hq",
	    size: new Vec2(40, 40),
	    doCollision: true,
	    hasHealth: true,
	    maxHealth: 25,
	},
        cost: new Resources(0, 0),
        generation: new Resources(0.025, 0),
    });

    static SOLAR = new BuildingType({
	entity_type: {
	    id: "building.solar",
	    size: new Vec2(50, 50),
	    doCollision: true,
	    hasHealth: false,
	    maxHealth: 100,
	},
        cost: new Resources(10, 15),
        generation: new Resources(0.1, 0),
    });

    static MINE = new BuildingType({
	entity_type: {
	    id: "building.mine",
	    size: new Vec2(10, 10),
	    doCollision: true,
	    hasHealth: true,
	    maxHealth: 50,
	},
        cost: new Resources(0, 0),
        generation: new Resources(0, 0),
    });

    constructor(args: BuildingTypeArgs) {
        this.cost = args.cost;
        this.generation = args.generation;
	this.entity_type = args.entity_type;
    }
}

export class Building extends Entity {
    static hurtCooldownMax = 5;

    static create_building_husk(): Building {
        return new Building(0, 0, true, BuildingType.HQ, 0);
    }

    public hurtCooldown: number = 0;
    public building_type: BuildingType;

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        building_type: BuildingType,
        health: number,
    ) {
        super(x, y, isCenter, building_type.entity_type, health);
        this.building_type = building_type;
    }

    injectBuildingData(
        x: number,
        y: number,
        isCenter: boolean,
        building_type: BuildingType,
        health: number,
    ) {
        this.injectEntityData(x, y, isCenter, building_type.entity_type, health);
	this.building_type = building_type;
    }

    drawHealth(view: Viewport) {
        if (this.building_type.entity_type.hasHealth) {
            const gapY = 4;
            const thickness = 3;

            const offX = this.pos.x;
            const offY = this.pos.y + this.building_type.entity_type.size.x + gapY;
            const healthSize = (this.health / this.building_type.entity_type.maxHealth) * this.building_type.entity_type.size.x;

            view.fillRect(offX, offY, healthSize, thickness, "red");
        }
    }


    draw() {
        switch (this.building_type) {
            case BuildingType.SOLAR:
		view.drawImage(BuildingType.SOLAR_TEXT, this.pos.x, this.pos.y);
                this.drawHealth(view);
                break;
            case BuildingType.HQ:
		view.drawImage(BuildingType.HQ_TEXT, this.pos.x, this.pos.y);
                this.drawHealth(view);
                break;
            case BuildingType.MINE:
                view.fillRect(this.pos.x, this.pos.y, this.building_type.entity_type.size.x, this.building_type.entity_type.size.y, "grey");
                this.drawHealth(view);
                break;
            default:
                throw new Error("Tried to draw a building that doesn't exist.");
        }
    }

    update(): void {
        this.hurtCooldown -= 1;
	Game.level!.currency.owned.add(this.building_type.generation);
    }

    doCollisionResults(e: Entity): void {
        if (this.building_type.entity_type.id === "building.hq" && e instanceof Enemy) {
            if (this.hurtCooldown <= 0) {
                this.hurtCooldown = Building.hurtCooldownMax;
                    this.health -= 1;
		    if(this.health <= 0) {
			if(!(window as any).is_cheat_mode_enabled) {
			    Game.screenToChangeTo = ScreenManager.END_SCREEN;
			}
		    }

            }
        }
    }
}
