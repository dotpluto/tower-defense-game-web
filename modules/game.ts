"use strict";

import { Vec2 } from "./vector2.js";
import { LevelDescriptor, Level } from "./level.js";
import { canvas, view } from "./graphics.js";
import { GameScreen } from "./screen.js";
import { passlog } from "./debug.js";
import { BuildingType } from "./building.js";
import { TowerType } from "./tower.js";

export class Game {
    static level: Level | null = null;
    static screen: GameScreen | null = null;
    static selBuildingType: BuildingType | null = null;

    static {
	(window as any).enableCheatMode = function() {
	    Game.level!.currency.owned.energy = Infinity;
	    Game.level!.currency.owned.nilrun = Infinity;
	};
    }

    static placeTower() {
        if (this.selBuildingType !== null && Game.level!.currency.owned.satisfies(this.selBuildingType.cost)) {
            const centerX = view.viewToWorldX(window.devicePixelRatio * this.screen!.lastMouseX);
            const centerY = view.viewToWorldY(window.devicePixelRatio * this.screen!.lastMouseY);

            const topLeft = new Vec2(centerX - this.selBuildingType.size.x / 2, centerY - this.selBuildingType.size.y / 2);

            for (const build of this.level!.buildings.alive) {
                if (Vec2.doVectorSquaresIntersect(topLeft, this.selBuildingType.size, build.pos, build.eType.size)) {
                    return;
                }
            }
            for (const tow of this.level!.towers.alive) {
                if (Vec2.doVectorSquaresIntersect(topLeft, this.selBuildingType.size, tow.pos, tow.eType.size)) {
                    return;
                }
            }

            if (this.selBuildingType instanceof TowerType) {
                this.level!.towers.reviveOrCreate().injectData(centerX, centerY, true, this.selBuildingType, this.selBuildingType.maxHealth);
            } else {
                this.level!.buildings.reviveOrCreate().injectData(centerX, centerY, true, this.selBuildingType, this.selBuildingType.maxHealth);
            }

            Game.level!.currency.owned.remove(this.selBuildingType.cost);
        }
    }

    static doFrame() {
        Game.level!.update();
        Game.level!.draw();
    }

    static init() {
        //TODO: add different levels and difficulties
        Game.loadLevel(new LevelDescriptor("Black", 100, new Vec2(2000, 2000)));
    }

    static loadLevel(levelDescriptor: LevelDescriptor) {
        Game.level = new Level(levelDescriptor);
    }

    //checking if the mouse currently is over something that can be clicked on
    static checkMouseInteract(): boolean {
	let posX = view.viewToWorldX(Game.screen!.lastMouseX * window.devicePixelRatio);
	let posY = view.viewToWorldY(Game.screen!.lastMouseY * window.devicePixelRatio);

	for(const enemy of Game.level!.towers) {
	    const inside = enemy.is_point_inside(posX, posY);
	    if(inside) {
		console.log(enemy);
		return true;
	    }
	}
	return false;
    }

    static moveView(x: number, y: number) {
        if (Game.level !== null) {
            view.center.x -= x;
	    view.center.y -= y;
        }
    }
}
