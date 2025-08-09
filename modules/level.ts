import { Vec2 } from "./vector2.js";
import { CollisionMap } from "./physics.js";
import {
    EntityList,
} from "./entity.js";
import { view, ctx, canvas } from "./graphics.js";
import { SpawnMan } from "./spawnLogic.js";
import { Game } from "./game.js";
import { CurrencyManager } from "./currency.js";
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
    projectiles = new EntityList<Projectile>(Projectile.create_projectile_husk);
    enemies = new EntityList<Enemy>(Enemy.create_enemy_husk);
    buildings = new EntityList<Building>(Building.create_building_husk);
    towers = new EntityList<Tower>(Tower.create_tower_husk);
    cm: CollisionMap;
    spawnMan: SpawnMan = new SpawnMan();
    currency: CurrencyManager = new CurrencyManager(100, 100);


    constructor(public desc: LevelDescriptor) {
        this.cm = new CollisionMap(desc.size.x, desc.size.y);
	this.buildings.revive_or_create().injectBuildingData(0, 0, true, BuildingType.HQ, BuildingType.HQ.entity_type.maxHealth);
    }

    draw() {
	view.clear(this.desc.color);

        this.cm.debugDraw(this);

	this.currency.update_graphics();

        //updating
        this.buildings.draw();
        this.towers.draw();
        this.enemies.draw();
        this.projectiles.draw();

        if (Game.selBuildingType !== null && !Game.is_blueprint_disabled) {
	    const worldX = view.viewToWorldX(Game.screen!.lastMouseX * window.devicePixelRatio);
	    const worldY = view.viewToWorldY(Game.screen!.lastMouseY * window.devicePixelRatio);

	    if(Game.selBuildingType instanceof TowerType) {
		    Tower.drawBlueprint(
			    view,
			    worldX,
			    worldY,
			    Game.selBuildingType,
		    );
	    }
        }
    }

    update() {
        //adding to collision map
        this.cm.reset();

        this.buildings.add_to_cm(this.cm);
        this.towers.add_to_cm(this.cm);
        this.enemies.add_to_cm(this.cm);
        this.projectiles.add_to_cm(this.cm);

        this.buildings.do_collisions();
        this.towers.do_collisions();
        this.enemies.do_collisions();
        this.projectiles.do_collisions();

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
