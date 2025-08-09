"use strict";

import { Vec2 } from "./vector2.js";
import { CollisionMap, SectionData } from "./physics.js";
import { } from "./level.js";
import { EffArray, fastDelete } from "./util.js";

export interface EntityTypeArgs {
    size: Vec2;
    doCollision: boolean;
    hasHealth: boolean;
    maxHealth: number;
    id: string;
}

export abstract class EntityType {
    public size: Vec2;
    public doCollision: boolean;
    public hasHealth: boolean;
    public maxHealth: number;
    public id: string;

    constructor(args: EntityTypeArgs) {
        this.size = args.size;
        this.doCollision = args.doCollision;
        this.hasHealth = args.hasHealth;
        this.maxHealth = args.maxHealth;
	this.id = args.id;
    }
}

export abstract class Entity {
    /**
      * Wheter this entity should be culled in the next check.
      */
    public markDead = false;
    public pos: Vec2 = new Vec2(0, 0);
    public entity_type: EntityType;
    public health: number;

    public sections: SectionData[] = []; //collision map sectors of current pass
    public origin_chunk_x: number = 0;
    public origin_chunk_y: number = 0;
    public chunk_num_x: number = 0;
    public chunk_num_y: number = 0;

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        entity_type: EntityType,
        health: number,
    ) {
        this.setPos(x, y, isCenter, entity_type.size);
        this.health = health;
	this.entity_type = entity_type
    }

    injectEntityData(
        x: number,
        y: number,
        isCenter: boolean,
        entity_type: EntityType,
        health: number,
    ) {
        this.setPos(x, y, isCenter, entity_type.size);
        this.health = health;
        this.entity_type = entity_type;
	this.markDead = false;
    }

    setPos(x: number, y: number, isCenter: boolean, size: Vec2) {
        this.pos.x = isCenter ? x - size.x / 2 : x;
        this.pos.y = isCenter ? y - size.y / 2 : y;
    }

    get center(): Vec2 {
        return new Vec2(
            this.pos.x + this.entity_type.size.x / 2,
            this.pos.y + this.entity_type.size.y / 2,
        );
    }

    get centX() {
        return this.pos.x + this.entity_type.size.x / 2;
    }

    get centY() {
        return this.pos.y + this.entity_type.size.y / 2;
    }

    checkForCollisions() {
        let checkedEntities: Set<Entity> = new Set();
        checkedEntities.add(this);

        for (const section of this.sections) {
            for (const entity of section.entities) {
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

    collidesWith(e: Entity) {
        return Vec2.doVectorSquaresIntersect(
            this.pos,
            this.entity_type.size,
            e.pos,
            e.entity_type.size,
        );
    }

    /** Mark as dead */
    die() {
        this.markDead = true;
    }

    // virtual functions
    draw(): void { }
    doCollisionResults(_: Entity): void { }
    cleanup() { } //cleanup should only be called by the cull function
    update() { }
    post_update() { }
    update_towers(_origin_chunk_x: number, _origin_chunk_y: number, _chunk_num_x: number, _chunk_num_y: number) {}

    static getDist(a: Entity, b: Entity) {
        let difX = a.centX - b.centX;
        let difY = a.centY - b.centY;
        return Vec2.numLength(difX, difY);
    }

    distanceTo<T extends Entity>(othEnt: T) {
        const difX = this.centX - othEnt.centX;
        const difY = this.centY - othEnt.centY;

        return Vec2.numLength(difX, difY);
    }

    is_point_inside(x: number, y: number) {
        return x >= this.pos.x && y >= this.pos.y && x < this.pos.x + this.entity_type.size.x && y < this.pos.y + this.entity_type.size.y;
    }
}

/*
 * Content is explicitly unordered!
 */
export class EntityList<T extends Entity> {
    public alive: EffArray<T> = new EffArray();
    public dead: EffArray<T> = new EffArray();

    constructor(private create_husk_of_t: () => T) { }

    add_to_cm(cm: CollisionMap) {
        for (let alive of this.alive) {
            cm.add_entity(alive);
        }
    }

    revive_or_create() {
        let revived_or_created = this.dead.pop();
	if(revived_or_created === undefined) {
	    revived_or_created = this.create_husk_of_t();
	}
	this.alive.push(revived_or_created);
	return revived_or_created;
    }

    update() {
        for (let alive of this.alive) {
            alive.update();
        }
    }

    post_update() {
        for (let alive of this.alive) {
            alive.post_update();
        }
    }

    draw() {
        for (let alive of this.alive) {
            alive.draw();
        }
    }

    do_collisions() {
        for (const alive of this.alive) {
            alive.checkForCollisions();
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
