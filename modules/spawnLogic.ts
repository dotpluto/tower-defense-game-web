import { Level } from "./level.js";
import { Enemy, EnemyType, Entity } from "./entity.js";
import { Vec2 } from "./vector2.js";
import { Game } from "./game.js";

export class SpawnMan {
	static maxTimer: number = 100;
	public timer: number = 0;

	update() {
		if(this.timer <= 0) {
			this.spawnEnemy();
			this.timer = SpawnMan.maxTimer - Game.level!.frameCount / 50;
		} else {
			this.timer -= 1;
		}
	}

	spawnEnemy() {
		let side = Math.floor((Math.random() * 4));
		
		let x, y;
		x = 0;
		y = 0;

		switch (side) {
			case 0: //top
				x = this.getRandomWidthPos();
				y = -Game.level!.desc.size.y / 2;
				break;
			case 1: //right
				x = Game.level!.desc.size.x / 2;
				y = this.getRandomHeightPos();
				break;
			case 2: //bottom
				x = this.getRandomWidthPos();
				y = Game.level!.desc.size.y / 2;
				break;
			case 3: //left
				x = -Game.level!.desc.size.x / 2;
				y = this.getRandomHeightPos();
				break;
		}

		Game.level!.enemies.reviveOrCreate().injectData(x, y, true, EnemyType.SMALL, EnemyType.SMALL.maxHealth);
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

	getRandomWidthPos() {
		return Math.random() * Game.level!.desc.size.x - Game.level!.desc.size.x / 2;
	}

	getRandomHeightPos() {
		return Math.random() * Game.level!.desc.size.y - Game.level!.desc.size.y / 2;
	}
}
