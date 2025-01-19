"use strict";

import { Vec2 } from "modules/vector2.js";
import { LevelDescriptor, Level } from "modules/level.js";
import { canvas } from "modules/graphics.js";
import { GameScreen } from "modules/screen.js";
import { Tower, TowerType } from "modules/entity.js";

export class Game {
    static level: Level | null = null;
	static screen: GameScreen | null = null;
	static selTowType: TowerType | null = null;

	static placeTower() {
		if(this.selTowType !== null && this.selTowType.cost <= Game.level!.money) {
			const centerX = this.level!.view.viewToWorldX(this.screen!.lastMouseX);
			const centerY = this.level!.view.viewToWorldY(this.screen!.lastMouseY);

			const topLeft = new Vec2(centerX - this.selTowType.size.x / 2, centerY - this.selTowType.size.y / 2);

			for(const build of this.level!.buildings) {
				if(Vec2.doVectorSquaresIntersect(topLeft, this.selTowType.size, build.pos, build.eType.size)) {
					return;
				}
			}
			for(const tow of this.level!.towers) {
				if(Vec2.doVectorSquaresIntersect(topLeft, this.selTowType.size, tow.pos, tow.eType.size)) {
					return;
				}
			}

			Tower.reuseOrCreate(this.level!, centerX, centerY, true, this.selTowType, 0);
			Game.level!.money -= this.selTowType.cost;
		}
	}

    static doFrame() {
        Game.level!.draw();
        Game.level!.update();
    }

    static init() {
        //TODO: add different levels and difficulties
        Game.loadLevel(new LevelDescriptor("black", 100, new Vec2(2000, 2000)));
    }

    static loadLevel(levelDescriptor: LevelDescriptor) {
        Game.level = new Level(levelDescriptor);
    }

	//checking if the mouse currently is over something that can be clicked on
	static checkMouseInteract(): boolean {
		//TODO Add something to click
		return false;
	}

	static moveView(x: number, y: number) {
		if(Game.level !== null) {
			Game.level.view.center.x -= x;
			Game.level.view.center.y -= y;
		}
	}
}
