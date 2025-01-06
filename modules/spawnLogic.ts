import { Level } from "modules/level.js";
import { Enemy, EnemyType, Entity } from "modules/entity.js";
import { Vec2 } from "modules/vector2.js";
import { Game } from "modules/game.js";

export class SpawnMan {
	static maxTimer: number = 10;
	public timer: number = 0;

	update() {
		if(this.timer <= 0) {
			this.spawnEnemy();
			this.timer = SpawnMan.maxTimer;
		} else {
			this.timer -= 1;
		}
	}

	spawnEnemy() {
		const level = Game.level as NonNullable<Level>;
		const building = this.getRandomBuilding(level);
		Vec2.numRandomUnit();
		Vec2.numScale(Vec2.numX, Vec2.numY, 800);
		Enemy.reuseOrCreate(level, Vec2.numX, Vec2.numY, true, EnemyType.SMALL, 1);
	}

	getRandomBuilding(level: Level): Entity<any> {
		const buildingCount = level.towers.length + level.buildings.length;
		const buildInd = Math.floor(buildingCount * Math.random());
		if(buildInd < level.towers.length) {
			return level.towers[buildInd];
		} else {
			return level.buildings[buildInd - level.towers.length];
		}
	}
}
