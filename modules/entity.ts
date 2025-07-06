"use strict";

import { Viewport, ctx, view, canvas } from "./graphics.js";
import { Vec2 } from "./vector2.js";
import { loadTexture } from "./assetManagement.js";
import { CollisionMap } from "./physics.js";
import { Game } from "./game.js";
import { } from "./level.js";
import { EffArray, fastDelete } from "./util.js";
import { Currency, Resources } from "./currency.js";

export interface EntityTypeArgs {
    size: Vec2;
    doCollision: boolean;
    hasHealth: boolean;
    maxHealth: number;
}

export abstract class EntityType {
    public size: Vec2;
    public doCollision: boolean;
    public hasHealth: boolean;
    public maxHealth: number;

    constructor(args: EntityTypeArgs) {
        this.size = args.size;
        this.doCollision = args.doCollision;
        this.hasHealth = args.hasHealth;
        this.maxHealth = args.maxHealth;
    }
}

export abstract class Entity<T extends EntityType> {
    /**
      * Wheter this entity should be culled in the next check.
      */
    public markDead = false;
    public pos: Vec2 = new Vec2(0, 0);
    public abstract eType: T;
    public health: number;

    public sections: Entity<any>[][] = []; //collision map sectors of current pass

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        eType: T,
        health: number,
    ) {
        this.setPos(x, y, isCenter, eType.size);
        this.health = health;
    }

    injectEntityData(
        x: number,
        y: number,
        isCenter: boolean,
        eType: T,
        health: number,
    ) {
        this.setPos(x, y, isCenter, eType.size);
        this.health = health;
        this.eType = eType;
    }

    setPos(x: number, y: number, isCenter: boolean, size: Vec2) {
        this.pos.x = isCenter ? x - size.x / 2 : x;
        this.pos.y = isCenter ? y - size.y / 2 : y;
    }

    get center(): Vec2 {
        return new Vec2(
            this.pos.x + this.eType.size.x / 2,
            this.pos.y + this.eType.size.y / 2,
        );
    }

    get centX() {
        return this.pos.x + this.eType.size.x / 2;
    }

    get centY() {
        return this.pos.y + this.eType.size.y / 2;
    }

    checkForCollisions() {
        let checkedEntities: Set<Entity<any>> = new Set();
        checkedEntities.add(this);

        for (const section of this.sections) {
            for (const entity of section) {
                if (checkedEntities.has(entity)) {
                    continue;
                }
                if (this.collidesWith(entity)) {
                    this.doCollisionResults(entity);
                }

                checkedEntities.add(entity);
            }
        }
    }

    collidesWith(e: Entity<any>) {
        return Vec2.doVectorSquaresIntersect(
            this.pos,
            this.eType.size,
            e.pos,
            e.eType.size,
        );
    }

    /** Mark as dead */
    die() {
        this.markDead = true;
    }

    // virtual functions
    draw(_: Viewport): void { }
    doCollisionResults(_: Entity<any>): void { }
    init(_: Currency) { }
    /**
      * This should only be called by the cull function (or its successor)
      */
    cleanup() { }
    update() { }
    post_update() {}

    /**
      * Create a empty husk ready for injection.
      */
    static createDefault() {
        throw new Error("Default static method wasn't overriden properly.");
    }

    distanceTo<T extends Entity<any>>(othEnt: T) {
        const difX = this.centX - othEnt.centX;
        const difY = this.centY - othEnt.centY;

        return Vec2.numLength(difX, difY);
    }

    is_point_inside(x: number, y: number) {
	return x >= this.pos.x && y >= this.pos.y && x < this.pos.x + this.eType.size.x && y < this.pos.y + this.eType.size.y;
    }
}

/*
 * Content is explicitly unordered!
 */
export class EntityList<T extends Entity<any>> {
    public alive: EffArray<T> = new EffArray();
    public dead: EffArray<T> = new EffArray();
    public createDefault: () => T;

    constructor(constr: new (...args: any[]) => T) {
        this.createDefault = (constr as any).createDefault;
    }

    reviveOrCreate(): T {
        let entity = this.dead.pop();
        if (entity === undefined) {
            entity = this.createDefault();
        }
        entity.markDead = false;
        this.alive.push(entity);
        return entity;
    }

    addToCm(cm: CollisionMap) {
        this.alive.forEach((entity) => {
            cm.add(entity);
        });
    }

    update() {
        for (let i = 0; i < this.alive.length; i++) {
            this.alive[i].update();
        }
    }

    post_update() {
        for (let i = 0; i < this.alive.length; i++) {
            this.alive[i].post_update();
        }
    }

    draw(cam: Viewport) {
        this.alive.forEach((entity) => {
            entity.draw(cam);
        });
    }

    doCollision() {
        for (const entity of this.alive) {
            entity.checkForCollisions();
        }
    }

    cull() {
        for (let i = 0; i < this.alive.length; i++) {
            const entity = this.alive[i];
            if (entity.markDead) {
                entity.cleanup();
                this.dead.push(entity);
                fastDelete(i, this.alive);
                i -= 1;
            }
        }
    }

    getRandom(): T {
        return this.alive[Math.floor(Math.random() * this.alive.length)];
    }

    [Symbol.iterator](): Iterator<T> {
	return this.alive[Symbol.iterator]();
    }
}
