"use strict";

import { Vec2 } from "./vector2.js";
import { LevelDescriptor, Level } from "./level.js";
import { canvas, view } from "./graphics.js";
import { GameScreen } from "./screen.js";
import { Building, BuildingType, Tower, TowerType } from "./entity.js";
import { passlog } from "./debug.js";

export class Game {
    static level: Level | null = null;
    static screen: GameScreen | null = null;
    static selBuildingType: BuildingType | null = null;

    static placeTower() {
        if (this.selBuildingType !== null /*&& Game.level!.currency.resourc.satisfies(this.selBuildingType.cost)*/) {
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

            Game.level!.currency.resourc.remove(this.selBuildingType.cost);
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
        //TODO Add something to click
        return false;
    }

    static moveView(x: number, y: number) {
        if (Game.level !== null) {
            view.center.x -= x;
	    view.center.y -= y;
        }
    }
}
