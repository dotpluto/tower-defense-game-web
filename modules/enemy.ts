import { Entity, EntityType, EntityTypeArgs } from "./entity.js";
import { Game } from "./game.js";
import { Viewport } from "./graphics.js";
import { Projectile } from "./projectile.js";
import { Tower } from "./tower.js";
import { EffArray, fastDelete } from "./util.js";
import { Vec2 } from "./vector2.js";

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
    public vel: Vec2 = new Vec2(0, 0);

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
            this.vel = Vec2.subtract(this.target.center, this.center);
            if (this.vel.length > Enemy.SPEED) {
                this.vel.normalize();
                this.vel.scale(Enemy.SPEED);
            }
	    if(isNaN(this.vel.x)) this.vel.x = 0;
	    if(isNaN(this.vel.y)) this.vel.y = 0;
        }

	this.pos.add(this.vel);

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
