"use strict";

import { Viewport, ctx, view, canvas } from "./graphics.js";
import { Vec2 } from "./vector2.js";
import { loadTexture } from "./assetManagement.js";
import { CollisionMap } from "./physics.js";
import { Game } from "./game.js";
import { } from "./level.js";
import { EffArray, fastDelete } from "./util.js";
import { Currency, Resources } from "./currency.js";

interface EntityTypeArgs {
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
}

interface BuildingTypeArgs extends EntityTypeArgs {
    cost: Resources;
    generation: Resources;
}

export class BuildingType extends EntityType {
    static HQ_TEXT = loadTexture("hq.png");
    static SOLAR_TEXT = loadTexture("solar_farm.png");
    static MINE_TEXT_EMPTY = loadTexture("quarry.png");
    static MINE_TEXT_FULL = loadTexture("quarry_mining.png");

    cost: Resources;
    generation: Resources;

    static HQ = new BuildingType({
        size: new Vec2(40, 40),
        doCollision: true,
        hasHealth: true,
        maxHealth: 100,
        cost: new Resources({}),
        generation: new Resources({ nilrun: 0.01, energy: 0.01 }),
    });

    static SOLAR = new BuildingType({
        size: new Vec2(50, 50),
        doCollision: true,
        hasHealth: true,
        maxHealth: 100,
        cost: new Resources({ energy: 10, nilrun: 15 }),
        generation: new Resources({ energy: 0.01 }),
    });

    static MINE = new BuildingType({
        size: new Vec2(10, 10),
        doCollision: true,
        hasHealth: true,
        maxHealth: 50,
        cost: new Resources({}),
        generation: new Resources({ nilrun: 0.01 }),
    });

    constructor(args: BuildingTypeArgs) {
        super(args);
        this.cost = args.cost;
        this.generation = args.generation;
    }

    doCollisionResults() { }
}

export class Building
    extends Entity<BuildingType> {
    static hurtCooldownMax = 5;
    public hurtCooldown: number = 0;

    static createDefault(): Building {
        return new Building(0, 0, true, BuildingType.HQ, 0);
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

    drawHealth(view: Viewport) {
        if (this.eType.hasHealth) {
            const gapY = 4;
            const thickness = 3;

            const offX = this.pos.x;
            const offY = this.pos.y + this.eType.size.x + gapY;
            const healthSize = (this.health / this.eType.maxHealth) * this.eType.size.x;

            view.fillRect(offX, offY, healthSize, thickness, "red");
        }
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

    draw(view: Viewport) {
        switch (this.eType) {
            case BuildingType.SOLAR:
		view.drawImage(BuildingType.SOLAR_TEXT, this.pos.x, this.pos.y);
                this.drawHealth(view);
                break;
            case BuildingType.HQ:
		view.drawImage(BuildingType.HQ_TEXT, this.pos.x, this.pos.y);
                this.drawHealth(view);
                break;
            case BuildingType.MINE:
                view.fillRect(this.pos.x, this.pos.y, this.eType.size.x, this.eType.size.y, "grey");
                this.drawHealth(view);
                break;
            default:
                throw new Error("Tried to draw a building that doesn't exist.");
        }
    }

    update(): void {
        this.hurtCooldown -= 1;
        switch (this.eType) {
            case BuildingType.MINE:
                break;
            default:
                Game.level!.currency.resourc.add(this.eType.generation);
                break;
        }
    }

    doCollisionResults(e: Entity<any>): void {
        if (e instanceof Enemy) {
            if (this.hurtCooldown <= 0) {
                this.hurtCooldown = Building.hurtCooldownMax;
                if (this.health > 0) {
                    this.health -= 1;
                }
            }
        }
    }
}

interface TowerTypeArgs extends BuildingTypeArgs {
    damage: number;
    shootCooldownMax: number;
    speed: number;
    range: number;
}

export class TowerType extends BuildingType {
    damage: number;
    shootCooldownMax: number;
    speed: number;
    range: number;

    static MG_TEXT = loadTexture("mg_turret_base.png");
    static ROCKET_TEXT = loadTexture("rocket_turret_base.png");
    static SNIPER_TEXT = loadTexture("sniper_turret_base.png");
    static MG_HEAD = loadTexture("mg_turret_head.png");
    static SNIPER_HEAD = loadTexture("sniper_turret_head.png");
    static ROCKET_HEAD = loadTexture("rocket_turret_head.png");

    static MG = new TowerType({
        size: new Vec2(48, 48),
        hasHealth: true,
        maxHealth: 50,
        doCollision: true,
        cost: new Resources({ energy: 50, nilrun: 10 }),
        shootCooldownMax: 5,
        damage: 2,
        speed: 8,
        generation: new Resources({}),
        range: 150,
    });
    static SNIPER = new TowerType({
        size: new Vec2(32, 32),
        hasHealth: true,
        maxHealth: 50,
        doCollision: true,
        cost: new Resources({ energy: 50, nilrun: 15 }),
        shootCooldownMax: 30,
        damage: 6,
        speed: 8,
        generation: new Resources({}),
        range: 300,
    });
    static ROCKET = new TowerType({
        size: new Vec2(32, 32),
        hasHealth: true,
        maxHealth: 50,
        doCollision: true,
        cost: new Resources({ energy: 50, nilrun: 10 }),
        shootCooldownMax: 20,
        damage: 16,
        speed: 8,
        generation: new Resources({}),
        range: 350,
    });

    constructor(args: TowerTypeArgs) {
        super(args);
        this.damage = args.damage;
        this.shootCooldownMax = args.shootCooldownMax;
        this.speed = args.speed;
        this.cost = args.cost;
        this.range = args.range;
    }
}

export class Tower extends Building {
    static createDefault(): Tower {
        return new Tower(0, 0, true, TowerType.MG, 0);
    }

    static drawBlueprint(
        view: Viewport,
        centX: number,
        centY: number,
        eType: TowerType,
    ) {
        view.fillRect(
            centX - eType.size.x / 2,
            centY - eType.size.y / 2,
            eType.size.x,
            eType.size.y,
            "blue",
        );
        view.drawCircleOutline(centX, centY, eType.range, "White");
    }

    public eType: TowerType;
    public shootCooldown: number = 0;
    public target: Enemy | null = null;
    public rotation: number = Math.random() * 2 * Math.PI;

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
        switch (this.eType) {
            case TowerType.ROCKET:
		view.drawImageCropped(TowerType.ROCKET_TEXT, this.eType.size.x, this.eType.size.y, this.pos.x, this.pos.y, 0, 0);
		this.drawHead(TowerType.ROCKET_HEAD, 32, 32);
                break;
            case TowerType.MG:
		view.drawImage(TowerType.MG_TEXT, this.pos.x, this.pos.y);
		this.drawHead(TowerType.MG_HEAD, 48, 48);
                break;
            case TowerType.SNIPER:
		view.drawImageCropped(TowerType.SNIPER_TEXT, this.eType.size.x, this.eType.size.y, this.pos.x, this.pos.y, 0, 0);
		this.drawHead(TowerType.SNIPER_HEAD, 32, 32);
                break;
        }
    }

    drawHead(head: HTMLOrSVGImageElement, head_width: number, head_height: number) {
	if(this.target !== null) {
	    this.rotation = Vec2.subtract(this.target.center, this.center).toRadians();
	}
	ctx.save()
	ctx.translate(canvas.width / 2 + this.center.x, canvas.height / 2 + this.center.y);
	ctx.rotate(this.rotation);
	ctx.drawImage(head, -head_height / 2, -head_width / 2);
	ctx.restore();
    }

    update() {
        this.findTarget();

        if (this.shootCooldown <= 0 && this.target !== null) {
            this.shoot();
            this.shootCooldown = (this.eType as TowerType).shootCooldownMax;
        } else {
            this.shootCooldown -= 1;
        }
    }

    shoot() {
        //this.target must be nonnull
        let dirX = this.target!.centX - this.centX;
        let dirY = this.target!.centY - this.centY;

        Vec2.numNormalize(dirX, dirY);
        dirX = Vec2.numX;
        dirY = Vec2.numY;

        Vec2.numScale(dirX, dirY, this.eType.speed);
        dirX = Vec2.numX;
        dirY = Vec2.numY;

        const type: ProjectileType =
            this.eType === TowerType.MG
                ? ProjectileType.BALL
                : ProjectileType.ROCKET;

        Game.level!.projectiles.reviveOrCreate().injectData(this.centX, this.centY, true, dirX, dirY, this.eType.damage, type);
    }

    findTarget() {
        const potEnem = Game.level!.enemies.getRandom();
        if (potEnem !== undefined && this.distanceTo(potEnem) <= this.eType.range) {
            if (this.target === null) {
                potEnem.addShooter(this);
                this.target = potEnem;
            } else {
                let dist = Enemy.getDist(this, this.target);
                let nDist = Enemy.getDist(this, potEnem);
                if (nDist < dist) {
                    this.target.removeShooter(this);
                    this.target = potEnem;
                    potEnem.addShooter(this);
                }
            }
        }
    }

    notifyTargetDied() {
        this.target = null;
    }
}

interface ProjectileTypeArgs extends EntityTypeArgs { }

export class ProjectileType extends EntityType {
    static BALL_TEXTURE = loadTexture("cannon_ball.png");
    static ROCKET_TEXTURE = loadTexture("cannon_ball.png");


    static BALL = new ProjectileType({
        size: new Vec2(12, 12),
        maxHealth: 0,
        hasHealth: false,
        doCollision: true,
    });
    static ROCKET = new ProjectileType({
        size: new Vec2(5, 5),
        maxHealth: 0,
        hasHealth: false,
        doCollision: true,
    });
    constructor(args: ProjectileTypeArgs) {
        super(args);
    }
}

export class Projectile extends Entity<ProjectileType> {

    static createDefault(): Projectile {
        return new Projectile(0, 0, true, 0, 0, 0, ProjectileType.BALL);
    }

    public vel: Vec2 = new Vec2(0, 0);

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        velX: number,
        velY: number,
        public damage: number,
        public eType: ProjectileType,
    ) {
        super(x, y, isCenter, eType, 0);
        this.vel.x = velX;
        this.vel.y = velY;
    }

    injectData(
        x: number,
        y: number,
        isCenter: boolean,
        velX: number,
        velY: number,
        damage: number,
        eType: ProjectileType,
    ) {
        this.injectEntityData(x, y, isCenter, eType, 0);
        this.vel.x = velX;
        this.vel.y = velY;
        this.damage = damage;
        this.eType = eType;
    }

    takeDamage() {
        this.damage -= 1;
        if (this.damage == 0) {
            this.markDead = true;
        }
    }

    draw(view: Viewport) {
        switch (this.eType) {
            case ProjectileType.ROCKET:
                view.fillRect(
                    this.pos.x,
                    this.pos.y,
                    this.eType.size.x,
                    this.eType.size.y,
                    "red",
                );
                break;
            case ProjectileType.BALL:
		view.drawImage(ProjectileType.BALL_TEXTURE, this.pos.x, this.pos.y);
                break;
        }
    }

    update() {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;

        if (
            this.pos.x + this.eType.size.x < -Game.level!.desc.size.x / 2 ||
            this.pos.x > Game.level!.desc.size.x / 2
        ) {
            this.markDead = true;
        }
        if (
            this.pos.y + this.eType.size.y < -Game.level!.desc.size.y / 2 ||
            this.pos.y > Game.level!.desc.size.y / 2
        ) {
            this.markDead = true;
        }
    }
}

interface EnemyTypeArgs extends EntityTypeArgs {
    reward: number;
    isArmored: boolean;
    maxHealth: number;
}
export class EnemyType extends EntityType {
    static SMALL = new EnemyType({
        size: new Vec2(15, 15),
        doCollision: true,
        hasHealth: true,
        maxHealth: 10,
        reward: 10,
        isArmored: false,
    });
    static BIG = new EnemyType({
        size: new Vec2(25, 25),
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
    static SPEED = 4;

    public eType: EnemyType;

    static createDefault(): Enemy {
        return new Enemy(0, 0, true, EnemyType.SMALL, 0);
    }

    static getDist(a: Entity<any>, b: Entity<any>) {
        let difX = a.centX - b.centX;
        let difY = a.centY - b.centY;
        return Vec2.numLength(difX, difY);
    }

    target: Entity<any> | null = null;
    lockedOnMe: EffArray<Tower> = new EffArray<Tower>();

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        eType: EnemyType,
        health: number,
    ) {
        super(x, y, isCenter, eType, health);
        this.eType = eType;
    }

    injectData(
        x: number,
        y: number,
        isCenter: boolean,
        eType: EnemyType,
        health: number,
    ) {
        this.injectEntityData(x, y, isCenter, eType, health);
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

    update() {
        if (this.target === null) {
            this.findTarget();
        }

        if (this.target !== null) {
            let dir = Vec2.subtract(this.target.center, this.center);
            if (dir.length > 0.3) {
                dir.normalize();
                dir.scale(Enemy.SPEED);
                this.pos.add(dir);
            }
        }

        if (this.markDead) {
            this.cleanup();
        }
        return this.markDead;
    }

    findTarget() {
        const target = Game.level!.buildings.alive[0] as Entity<any>;
        if (target !== undefined) {
            this.target = target;
        }
    }

    //target lock
    addShooter(shooter: Tower) {
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
        this.lockedOnMe.clear();
    }

    doCollisionResults(oEntity: Entity<any>): void {
        if (oEntity instanceof Projectile) {
            if (!this.markDead) {
                Game.level!.currency.resourc.nilrun += 0.1;
            }
            this.markDead = true;
            oEntity.takeDamage();
        } else if (oEntity instanceof Enemy) {
            let difX = oEntity.pos.x - this.pos.x;
            let difY = oEntity.pos.y - this.pos.y;
            Vec2.numNormalize(difX, difY);
            difX = Vec2.numX;
            difY = Vec2.numY;
            Vec2.numScale(difX, difY, 8);
            this.pos.x -= difX;
            this.pos.y -= difY;
        }
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
}
