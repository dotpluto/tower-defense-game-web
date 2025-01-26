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
import { Currency } from "modules/currency.js";

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
	currency: Currency = new Currency({ nilrun: 100, energy: 100 });


    constructor(public desc: LevelDescriptor) {
        this.cm = new CollisionMap(desc.size.x, desc.size.y);
		const hq = new Building(0, 0, true, BuildingType.HQ, BuildingType.HQ.maxHealth);
		hq.init(this.currency);
		this.buildings.push(hq);

		let nodeNum = 5;
		const sizeX = desc.size.x - BuildingType.MINE.size.x;
		const sizeY = desc.size.y - BuildingType.MINE.size.y;
		while(nodeNum > 0) {
			const posX = Math.random() * sizeX;
			const posY = Math.random() * sizeY;
			let skip = false;
			for (let index = 0; index < this.buildings.length; index++) {
				const build = this.buildings[index];
				if(Vec2.doVectorSquaresIntersect(new Vec2(posX, posY), BuildingType.MINE.size, build.pos, build.eType.size)) {
					skip = true;
					break;
				}
			}
			if(skip) {
				continue;
			}

			const node = new Building(posX, posX, true, BuildingType.MINE, BuildingType.MINE.maxHealth);
			node.init(this.currency);
			this.buildings.push(node);
			nodeNum -= 1;
		}
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
