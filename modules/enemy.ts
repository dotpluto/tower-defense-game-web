import { Entity, EntityType } from "./entity.js";
import { Game } from "./game.js";
import { view } from "./graphics.js";
import { Projectile } from "./projectile.js";
import { Tower } from "./tower.js";
import { EffArray, fastDelete } from "./util.js";
import { Vec2 } from "./vector2.js";

interface EnemyTypeArgs {
    reward: number;
    isArmored: boolean;
    entity_type: EntityType;
}

export class EnemyType {

    public reward: number;
    public isArmored: boolean;
    public entity_type: EntityType;

    constructor(args: EnemyTypeArgs) {
        this.reward = args.reward;
        this.isArmored = args.isArmored;
        this.entity_type = args.entity_type;
    }
    static SMALL = new EnemyType({
        entity_type: {
            id: "enemy.small",
            size: new Vec2(15, 15),
            doCollision: true,
            hasHealth: true,
            maxHealth: 10,
        },
        reward: 10,
        isArmored: false,
    });
    static BIG = new EnemyType({
        entity_type: {
            id: "enemy.big",
            size: new Vec2(25, 25),
            doCollision: true,
            hasHealth: true,
            maxHealth: 10,
        },
        reward: 10,
        isArmored: false,
    });
}

export class Enemy extends Entity {
    static DEFAULT_SPEED = 4;

    static create_enemy_husk(): Enemy {
        return new Enemy(0, 0, true, EnemyType.SMALL, 0);
    }

    public enemy_type: EnemyType;
    public vel: Vec2 = new Vec2(0, 0);

    target: Entity | null = null;
    lockedOnMe: EffArray<Tower> = new EffArray<Tower>();

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        enemy_type: EnemyType,
        health: number,
    ) {
        super(x, y, isCenter, enemy_type.entity_type, health);
        this.enemy_type = enemy_type;
    }

    injectEnemyData(
        x: number,
        y: number,
        isCenter: boolean,
        enemy_type: EnemyType,
        health: number,
    ) {
        this.injectEntityData(x, y, isCenter, enemy_type.entity_type, health);
        this.enemy_type = enemy_type;
    }

    draw() {
        view.fillRect(
            this.pos.x,
            this.pos.y,
            this.enemy_type.entity_type.size.x,
            this.enemy_type.entity_type.size.y,
            "red",
        );
    }

    update() {
        if (this.target === null) {
            this.findTarget();
        }

        if (this.target !== null) {
            let target_diff: Vec2 = Vec2.subtract(this.target!.center, this.center);
            if (target_diff.length > Enemy.DEFAULT_SPEED) {
                target_diff.normalize();
                target_diff.scale(Enemy.DEFAULT_SPEED);
            }

            if (this.vel.x > target_diff.x) this.vel.x -= 0.2;
            if (this.vel.x < target_diff.x) this.vel.x += 0.2;
            if (this.vel.y > target_diff.y) this.vel.y -= 0.2;
            if (this.vel.y < target_diff.y) this.vel.y += 0.2;
        }

        if (this.markDead) {
            this.cleanup();
        }
        return this.markDead;
    }

    post_update() {
        this.pos.add(this.vel);
    }

    findTarget() {
        const target = Game.level!.buildings.alive[0] as Entity;
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

    doCollisionResults(oEntity: Entity): void {
        if (oEntity instanceof Projectile) {
            if (!this.markDead) {
                Game.level!.currency.owned.nilrun += 0.1;
            }
            this.markDead = true;
            oEntity.takeDamage();
        } else if (oEntity instanceof Enemy) {
            let diff = Vec2.subtract(oEntity.center, this.center);
            diff.normalize();
            diff.scale(1);
            this.vel.x -= diff.x;
            this.vel.y -= diff.y;
        }
    }
}
