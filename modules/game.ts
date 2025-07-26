"use strict";

import { Vec2 } from "./vector2.js";
import { LevelDescriptor, Level } from "./level.js";
import { view } from "./graphics.js";
import { GameScreen, Screen } from "./screen.js";
import { TowerType } from "./tower.js";
import { ScreenManager } from "./screenManager.js";

export class Game {
    static level: Level | null = null;
    static screen: GameScreen | null = null;
    static selBuildingType: TowerType | null = null;
    static screenToChangeTo: Screen|null = null;

    static {
        (window as any).enableCheatMode = function() {
            Game.level!.currency.owned.energy = Infinity;
            Game.level!.currency.owned.nilrun = Infinity;
        };
    }

    static placeTower() {

        if (Game.selBuildingType !== null && Game.level!.currency.owned.satisfies(Game.selBuildingType.building_type.cost)) {
            const tower_type = Game.selBuildingType;
            const building_type = tower_type.building_type;
            const entity_type = building_type.entity_type;
            const centerX = view.viewToWorldX(window.devicePixelRatio * this.screen!.lastMouseX);
            const centerY = view.viewToWorldY(window.devicePixelRatio * this.screen!.lastMouseY);

            const topLeft = new Vec2(centerX - entity_type.size.x / 2, centerY - entity_type.size.y / 2);

            for (const build of this.level!.buildings.alive) {
                if (Vec2.doVectorSquaresIntersect(topLeft, entity_type.size, build.pos, entity_type.size)) {
                    return;
                }
            }
            for (const tow of this.level!.towers.alive) {
                if (Vec2.doVectorSquaresIntersect(topLeft, entity_type.size, tow.pos, tow.building_type.entity_type.size)) {
                    return;
                }
            }

            this.level!.towers.revive_or_create().injectTowerData(centerX, centerY, true, tower_type, entity_type.maxHealth);
            Game.level!.currency.owned.remove(building_type.cost);
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

        for (const tower of Game.level!.towers) {
            const inside = tower.is_point_inside(posX, posY);
            if (inside) {
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
