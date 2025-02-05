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
		level.enemies.reviveOrCreate().injectData(Vec2.numX, Vec2.numY, true, EnemyType.SMALL, EnemyType.SMALL.maxHealth);
	}

	getRandomBuilding(level: Level): Entity<any> {
		const buildingCount = level.towers.alive.length + level.buildings.alive.length;
		const buildInd = Math.floor(buildingCount * Math.random());
		if(buildInd < level.towers.alive.length) {
			return level.towers.alive[buildInd];
		} else {
			return level.buildings.alive[buildInd - level.towers.alive.length];
		}
	}
}
