import { loadTexture } from "./assetManagement.js";
import { Entity, EntityType, EntityTypeArgs } from "./entity.js";
import { Game } from "./game.js";
import { Viewport } from "./graphics.js";
import { Vec2 } from "./vector2.js";

export interface ProjectileTypeArgs extends EntityTypeArgs { }

export class ProjectileType extends EntityType {
    static BALL_TEXTURE = loadTexture("cannon_ball.png");
    static ROCKET_TEXTURE = loadTexture("rocket.png");


    static BALL = new ProjectileType({
        size: new Vec2(12, 12),
        maxHealth: 0,
        hasHealth: false,
        doCollision: true,
    });
    static ROCKET = new ProjectileType({
        size: new Vec2(10, 10),
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
		let center = this.center;
		view.drawImageRotated(ProjectileType.ROCKET_TEXTURE, center.x, center.y, this.vel.toRadians())
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
