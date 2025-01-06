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

class WaveProfile {
    constructor() {}
}

class WaveModType {}

export class Level {
    frameCount: number = 0;
    view: Viewport = new Viewport(new Vec2(0, 0));
    projectiles = new EntityList<Projectile>();
    enemies = new EntityList<Enemy>();
    buildings = new EntityList<Building>();
    towers = new EntityList<Tower>();
    cm: CollisionMap;
	spawnMan: SpawnMan = new SpawnMan();

    constructor(public desc: LevelDescriptor) {
        this.cm = new CollisionMap(desc.size.x, desc.size.y);

		this.buildings.push(new Building(0, 0, true, BuildingType.HQ, 100));
    }

    draw() {
        ctx.fillStyle = this.desc.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.cm.debugDraw(this);

        //updating
        this.buildings.draw(this.view);
        this.towers.draw(this.view);
        this.enemies.draw(this.view);
        this.projectiles.draw(this.view);

		if(Game.selTowType !== null) {
			Tower.drawBlueprint(this.view, this.view.viewToWorldX(Game.screen!.lastMouseX), this.view.viewToWorldY(Game.screen!.lastMouseY), Game.selTowType);
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

        this.frameCount += 1;
    }
}
