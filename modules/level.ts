import { typeAssert, instanceAssert, assert } from "modules/debug.js";
import { Vec2 } from "modules/vector2.js";
import { CollisionMap } from "modules/physics.js";
import {
    Tower,
    TowerType,
    Projectile,
    ProjectileType,
    Building,
    BuildingType,
    Enemy,
    EnemyType,
    EntityList,
} from "modules/entity.js";
import { Viewport, ctx, canvas } from "modules/graphics.js";
import { SpawnMan } from "modules/spawnLogic.js";
import { Game } from "modules/game.js";

export class LevelDescriptor {
    constructor(
        public color: string,
        public safeBuildRadius: number,
        public size: Vec2,
    ) {}
}

export class Level {
    frameCount: number = 0;
    view: Viewport = new Viewport(new Vec2(0, 0));
    projectiles = new EntityList<Projectile>();
    enemies = new EntityList<Enemy>();
    buildings = new EntityList<Building>();
    towers = new EntityList<Tower>();
    cm: CollisionMap;
    spawnMan: SpawnMan = new SpawnMan();
	currency: Currency = new Currency({ metal: 50, energy: 50 });


    constructor(public desc: LevelDescriptor) {
        this.cm = new CollisionMap(desc.size.x, desc.size.y);

        this.buildings.push(new Building(0, 0, true, BuildingType.HQ, 100));
		this.buildings.push(new Building(100, 100, true, BuildingType.SOLAR, 50));
    }

    draw() {
        ctx.fillStyle = this.desc.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        //this.cm.debugDraw(this);

        //updating
        this.buildings.draw(this.view);
        this.towers.draw(this.view);
        this.enemies.draw(this.view);
        this.projectiles.draw(this.view);

        if (Game.selBuildingType !== null) {
			const worldX = this.view.viewToWorldX(Game.screen!.lastMouseX);
			const worldY = this.view.viewToWorldY(Game.screen!.lastMouseY);

			if(Game.selBuildingType instanceof TowerType) {
				Tower.drawBlueprint(
					this.view,
					worldX,
					worldY,
					Game.selBuildingType,
				);
			} else {
				this.view.fillRect(worldX - Game.selBuildingType.size.x / 2, worldY - Game.selBuildingType.size.y / 2, Game.selBuildingType.size.x, Game.selBuildingType.size.y, "green");
			}
        }
    }

    update() {
        //adding to collision map
        this.cm.reset();

        this.buildings.addToCm(this.cm);
        this.towers.addToCm(this.cm);
        this.enemies.addToCm(this.cm);
        this.projectiles.addToCm(this.cm);

        this.buildings.doCollision();
        this.towers.doCollision();
        this.enemies.doCollision();
        this.projectiles.doCollision();

        this.buildings.update();
        this.towers.update();
        this.enemies.update();
        this.projectiles.update();

        this.buildings.cull();
        this.towers.cull();
        this.enemies.cull();
        this.projectiles.cull();

        //spawning logic
        this.spawnMan.update();
		this.currency.update();

        this.frameCount += 1;
    }
}

export class Currency {
	public metal: number;
	public energy: number;

	static metalBaseGain = 0.01;
	static energyBaseGain = 0.1;

	constructor({ metal, energy }: { metal: number, energy: number }) {
		this.metal = metal;
		this.energy = energy;
	}

	update() {
		this.metal += Currency.metalBaseGain;
		this.energy += Currency.energyBaseGain;
	}

	registerCurrencyProvider(build: Building) {
	}
}
