import { typeAssert, instanceAssert, assert } from "./debug.js";
import { Vec2 } from "./vector2.js";
import { CollisionMap } from "./physics.js";
import {
    EntityList,
} from "./entity.js";
import { view, ctx, canvas } from "./graphics.js";
import { SpawnMan } from "./spawnLogic.js";
import { Game } from "./game.js";
import { Currency } from "./currency.js";
import { Projectile } from "./projectile.js";
import { Enemy } from "./enemy.js";
import { Building, BuildingType } from "./building.js";
import { Tower, TowerType } from "./tower.js";

export class LevelDescriptor {
    constructor(
        public color: string,
        public safeBuildRadius: number,
        public size: Vec2,
    ) {}
}

export class Level {
    frameCount: number = 0;
    projectiles = new EntityList<Projectile>(Projectile);
    enemies = new EntityList<Enemy>(Enemy);
    buildings = new EntityList<Building>(Building);
    towers = new EntityList<Tower>(Tower);
    cm: CollisionMap;
    spawnMan: SpawnMan = new SpawnMan();
	currency: Currency = new Currency({ nilrun: 100, energy: 100 });


    constructor(public desc: LevelDescriptor) {
        this.cm = new CollisionMap(desc.size.x, desc.size.y);
		this.buildings.reviveOrCreate().injectData(0, 0, true, BuildingType.HQ, BuildingType.HQ.maxHealth);
		/*
		let nodeNum = 5;
		const sizeX = desc.size.x - BuildingType.MINE.size.x;
		const sizeY = desc.size.y - BuildingType.MINE.size.y;
		while(nodeNum > 0) {
			const posX = Math.random() * sizeX;
			const posY = Math.random() * sizeY;
			let skip = false;
			for (let index = 0; index < this.buildings.alive.length; index++) {
				const build = this.buildings.alive[index];
				if(Vec2.doVectorSquaresIntersect(new Vec2(posX, posY), BuildingType.MINE.size, build.pos, build.eType.size)) {
					skip = true;
					break;
				}
			}
			if(skip) {
				continue;
			}

			this.buildings.reviveOrCreate().injectData(posX, posY, true, BuildingType.MINE, BuildingType.MINE.maxHealth);
			nodeNum -= 1;
		}
		*/
    }

    draw() {
        ctx.fillStyle = this.desc.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        //this.cm.debugDraw(this);

        //updating
        this.buildings.draw(view);
        this.towers.draw(view);
        this.enemies.draw(view);
        this.projectiles.draw(view);

        if (Game.selBuildingType !== null) {
			const worldX = view.viewToWorldX(Game.screen!.lastMouseX * window.devicePixelRatio);
			const worldY = view.viewToWorldY(Game.screen!.lastMouseY * window.devicePixelRatio);

			if(Game.selBuildingType instanceof TowerType) {
				Tower.drawBlueprint(
					view,
					worldX,
					worldY,
					Game.selBuildingType,
				);
			} else {
				view.fillRect(worldX - Game.selBuildingType.size.x / 2, worldY - Game.selBuildingType.size.y / 2, Game.selBuildingType.size.x, Game.selBuildingType.size.y, "green");
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


        this.buildings.post_update();
        this.towers.post_update();
        this.enemies.post_update();
        this.projectiles.post_update();

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
