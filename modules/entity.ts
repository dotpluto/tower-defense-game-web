"use strict";

import { Viewport } from "modules/graphics.js";
import { Vec2 } from "modules/vector2.js";
import { loadTexture } from "modules/assetManagement.js";
import { CollisionMap } from "modules/physics.js";
import { Game } from "modules/game.js";
import { Level } from "modules/level.js";
import { fastDelete } from "modules/util.js";

interface EntityTypeArgs {
    size: Vec2;
    doCollision: boolean;
    hasHealth: boolean;
    maxHealth: number;
}

type hasDied = boolean;

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
    }

    setPos(x: number, y: number, isCenter: boolean, size: Vec2) {
        this.pos.x = isCenter ? x - size.x / 2 : x;
        this.pos.y = isCenter ? y - size.y / 2 : y;
    }

    draw(_: Viewport): void {}

    update(): hasDied {
        return false;
    }

    get center(): Vec2 {
        return new Vec2(
            this.pos.x + this.eType.size.x / 2,
            this.pos.y + this.eType.size.y / 2,
        );
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

    doCollisionResults(_: Entity<any>): void {}
}


interface BuildingTypeArgs extends EntityTypeArgs {}

export class BuildingType extends EntityType {
    static HQ_TEX = loadTexture("hq.png");

    static HQ = new BuildingType({
        size: new Vec2(40, 40),
        doCollision: true,
        hasHealth: true,
        maxHealth: 100,
    });

    constructor(args: BuildingTypeArgs) {
        super(args);
    }

    draw(build: Building, cam: Viewport) {
        switch (this) {
            case BuildingType.HQ:
                cam.drawImage(BuildingType.HQ_TEX, build.pos.x, build.pos.y);
                break;
            default:
                throw new Error("Tried to draw a building that doesn't exist.");
        }
    }

    doCollisionResults() {}
}

export class Building extends Entity<BuildingType> {
    static reuseOrCreate(
        level: Level,
        x: number,
        y: number,
        isCenter: boolean,
        eType: BuildingType,
        health: number,
    ) {
        const building = level.buildings.reviveEntityMustHandle();
        if (building !== undefined) {
            building.injectData(x, y, true, eType, 100);
        } else {
            level.buildings.push(new Building(x, y, isCenter, eType, health));
        }
    }

    public eType: BuildingType;

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        eType: BuildingType,
        health: number,
    ) {
        super(x, y, isCenter, eType, health);
        this.eType = eType;
    }

    injectData(
        x: number,
        y: number,
        isCenter: boolean,
        eType: BuildingType,
        health: number,
    ) {
        this.injectEntityData(x, y, isCenter, eType, health);
    }

    draw(cam: Viewport) {
        this.eType.draw(this, cam);
    }
}

interface TowerTypeArgs extends EntityTypeArgs {
    damage: number;
    cost: number;
    shootCooldownMax: number;
    speed: number;
}

export class TowerType extends BuildingType {
    damage: number;
    cost: number;
    shootCooldownMax: number;
    speed: number;
    static MG = new TowerType({
        size: new Vec2(48, 48),
        hasHealth: false,
        maxHealth: 0,
        doCollision: false,
        cost: 55,
        shootCooldownMax: 6,
        damage: 2,
        speed: 8,
    });
    static SNIPER = new TowerType({
        size: new Vec2(32, 32),
        hasHealth: false,
        maxHealth: 0,
        doCollision: false,
        cost: 30,
        shootCooldownMax: 30,
        damage: 8,
        speed: 8,
    });
    static ROCKET = new TowerType({
        size: new Vec2(32, 32),
        hasHealth: false,
        maxHealth: 0,
        doCollision: false,
        cost: 100,
        shootCooldownMax: 10,
        damage: 16,
        speed: 8,
    });

    constructor(args: TowerTypeArgs) {
        super(args);
        this.damage = args.damage;
        this.cost = args.cost;
        this.shootCooldownMax = args.shootCooldownMax;
        this.speed = args.speed;
    }
}

export class Tower extends Entity<TowerType> {
    static reuseOrCreate(
        level: Level,
        x: number,
        y: number,
        isCenter: boolean,
        eType: TowerType,
        health: number,
    ) {
        const tower = level.towers.reviveEntityMustHandle();
        if (tower !== undefined) {
            tower.injectData(x, y, true, eType, 100);
        } else {
            level.buildings.push(new Building(x, y, isCenter, eType, health));
        }
    }

    public eType: TowerType;
    public shootCooldown: number = 0;
    public target: Enemy | null = null;

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        eType: TowerType,
        health: number,
    ) {
        super(x, y, isCenter, eType, health);
        this.eType = eType;
    }

    injectData(
        x: number,
        y: number,
        isCenter: boolean,
        eType: TowerType,
        health: number,
    ) {
        this.injectEntityData(x, y, isCenter, eType, health);
    }

    draw(view: Viewport) {
        view.fillRect(
            this.pos.x,
            this.pos.y,
            this.eType.size.x,
            this.eType.size.y,
            "blue",
        );
    }

    update(): hasDied {
        if (this.target === null) {
            this.findTarget();
        }

        if (this.shootCooldown <= 0 && this.target !== null) {
            this.shoot();
            this.shootCooldown = (this.eType as TowerType).shootCooldownMax;
        } else {
            this.shootCooldown -= 1;
        }

        return false;
    }

    shoot() {
        const speed = this.eType.speed;
        const dir = Vec2.subtract(this.target!.pos, this.pos);
        dir.normalize();
        dir.scale(speed);
        const projHead = dir;

        const center = this.center;

        const entity = Game.level?.projectiles.reviveEntityMustHandle();
        if (entity !== undefined) {
            entity.injectData(
                center.x,
                center.y,
                true,
                0,
                projHead.x,
                projHead.y,
                1,
                ProjectileType.BALL,
            );
        } else {
            Game.level?.projectiles.push(
                new Projectile(
                    center.x,
                    center.y,
                    true,
                    1,
                    projHead.x,
                    projHead.y,
                    1,
                    ProjectileType.BALL,
                ),
            );
        }
    }

    findTarget() {
        const potEnem = Game.level?.enemies.at(0);
        if (potEnem !== undefined) {
            potEnem.addLock(this);
            this.target = potEnem;
        }
    }

    notifyTargetDied() {
        this.target = null;
    }
}

interface ProjectileTypeArgs extends EntityTypeArgs {}

export class ProjectileType extends EntityType {
    static BALL = new ProjectileType({
        size: new Vec2(16, 16),
        maxHealth: 0,
        hasHealth: false,
        doCollision: true,
    });
    static ROCKET = new ProjectileType({
        size: new Vec2(16, 16),
        maxHealth: 0,
        hasHealth: false,
        doCollision: true,
    });
    constructor(args: ProjectileTypeArgs) {
        super(args);
    }
}

export class Projectile extends Entity<ProjectileType> {
    public vel: Vec2 = new Vec2(0, 0);

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        health: number,
        velX: number,
        velY: number,
        public damage: number,
        public eType: ProjectileType,
    ) {
        super(
			x,
			y,
			isCenter,
			eType,
			health,
        );
        this.vel.x = velX;
        this.vel.y = velY;
    }

    injectData(
        x: number,
        y: number,
        isCenter: boolean,
        health: number,
        velX: number,
        velY: number,
        damage: number,
        eType: ProjectileType,
    ) {
        this.injectEntityData(
			x,
			y,
			isCenter,
			eType,
            health,
        );
        this.vel.x = velX;
        this.vel.y = velY;
        this.damage = damage;
        this.eType = eType;
    }

    draw(view: Viewport) {
        view.fillRect(
            this.pos.x,
            this.pos.y,
            this.eType.size.x,
            this.eType.size.y,
            "orange",
        );
    }

    update(): hasDied {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        if (Game.level !== null) {
            if (
                this.pos.x + this.eType.size.x <
                    0 - Game.level.desc.size.x / 2 ||
                this.pos.x > Game.level.desc.size.x / 2
            ) {
                return true;
            }
            if (
                this.pos.y + this.eType.size.y <
                    0 - Game.level.desc.size.y / 2 ||
                this.pos.y > Game.level.desc.size.y / 2
            ) {
                return true;
            }
        }

        return false;
    }
}

interface EnemyTypeArgs extends EntityTypeArgs {
    reward: number;
    isArmored: boolean;
    maxHealth: number;
}
export class EnemyType extends EntityType {
    static SMALL = new EnemyType({
        size: new Vec2(10, 10),
        doCollision: true,
        hasHealth: true,
        maxHealth: 10,
        reward: 10,
        isArmored: false,
    });
    static BIG = new EnemyType({
        size: new Vec2(16, 16),
        doCollision: true,
        hasHealth: true,
        maxHealth: 10,
        reward: 10,
        isArmored: false,
    });

    public reward: number;
    public isArmored: boolean;

    constructor(args: EnemyTypeArgs) {
        super(args);
        this.reward = args.reward;
        this.isArmored = args.isArmored;
    }
}

export class Enemy extends Entity<EnemyType> {
    static SPEED = 1;

    static reuseOrCreate(
        level: Level,
        x: number,
        y: number,
        isCenter: boolean,
        eType: EnemyType,
        health: number,
    ) {
        const entity = level.enemies.reviveEntityMustHandle();
        if (entity !== undefined) {
            entity.injectData(x, y, true, EnemyType.SMALL, 1);
        } else {
            level.enemies.push(new Enemy(x, y, isCenter, eType, health));
        }
    }

    target: Entity<any> | null = null;
    lockedOnMe: Tower[] = [];

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        public eType: EnemyType,
        health: number,
    ) {
        super(
			x,
			y,
			isCenter,
			eType,
            health,
        );
    }

    injectData(
        x: number,
        y: number,
        isCenter: boolean,
        eType: EnemyType,
        health: number,
    ) {
        this.injectEntityData(
			x,
			y,
			isCenter,
			eType,
            health,
        );
        this.eType = eType;
    }

    draw(cam: Viewport) {
        cam.fillRect(
            this.pos.x,
            this.pos.y,
            this.eType.size.x,
            this.eType.size.y,
            "red",
        );
    }

    update(): hasDied {
        if (this.target === null) {
            this.findTarget();
        }

        if (this.target !== null) {
            let dir = Vec2.subtract(this.target.center, this.center);
            if (dir.length > 0.3) {
                dir.normalize();
                dir.scale(Enemy.SPEED);
                this.pos.add(dir); }
        }

        if (this.markDead) {
            this.cleanup();
        }
        return this.markDead;
    }

    findTarget() {
        this.target = Game.level?.buildings[0] as Entity<any>;
    }

    //target lock
    addLock(shooter: Tower) {
        this.lockedOnMe.push(shooter);
    }

    removeShooter(shooter: Tower) {
        for (let i = 0; i < this.lockedOnMe.length; i++) {
            if (shooter === this.lockedOnMe[i]) {
                fastDelete(i, this.lockedOnMe);
                return;
            }
        }
    }

    cleanup() {
        for (const tower of this.lockedOnMe) {
            tower.notifyTargetDied();
        }

        //Delete array in a performant manner to avoid any infinte gc loops
        (this.lockedOnMe as any) = null;
    }

    doCollisionResults(oEntity: Entity<any>): void {
        if (oEntity instanceof Projectile) {
            this.markDead = true;
        }
    }
}

/*
 * Content is explicitly unordered!
 */
export class EntityList<T extends Entity<any>> extends Array<T> {
    public deadList: T[] = [];

    constructor() {
        super();
    }

    //operate on content
    addToCm(cm: CollisionMap) {
        this.forEach((entity) => {
            cm.add(entity);
        });
    }

    draw(cam: Viewport) {
        this.forEach((entity) => {
            entity.draw(cam);
        });
    }

    update() {
        for (let i = 0; i < this.length; i++) {
            const element = this[i];
            const hasDied = element.update();
            if (hasDied) {
                this.deadList.push(element);
                fastDelete(i, this);
                i -= 1;
            }
        }

        this.forEach((entity) => {
            entity.update();
        });
    }

    doCollision() {
        for (const entity of this) {
            entity.checkForCollisions();
        }
    }

    //modify
    reviveEntityMustHandle() {
        const entity = this.deadList.pop();
        if (entity !== undefined) {
            this.push(entity);
        }
        return entity;
    }
}
