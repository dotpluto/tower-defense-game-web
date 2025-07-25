import { loadTexture } from "./assetManagement.js";
import { Entity, EntityType } from "./entity.js";
import { Game } from "./game.js";
import { view } from "./graphics.js";
import { Vec2 } from "./vector2.js";

export interface ProjectileTypeArgs {
    entity_type: EntityType;
}

export class ProjectileType {
    static BALL_TEXTURE = loadTexture("cannon_ball.png");
    static ROCKET_TEXTURE = loadTexture("rocket.png");

    public entity_type: EntityType;

    static BALL = new ProjectileType({
	entity_type: {
	    id: "projectile.ball",
	    size: new Vec2(12, 12),
	    maxHealth: 0,
	    hasHealth: false,
	    doCollision: true,
	},
    });
    static ROCKET = new ProjectileType({
	entity_type: {
	    id: "projectile.rocket",
	    size: new Vec2(10, 10),
	    maxHealth: 0,
	    hasHealth: false,
	    doCollision: true,
	},
    });

    constructor(args: ProjectileTypeArgs) {
	this.entity_type = args.entity_type;
    }
}

export class Projectile extends Entity {
    public vel: Vec2 = new Vec2(0, 0);
    public damage: number;
    protected projectile_type: ProjectileType;

    static create_projectile_husk(): Projectile {
        return new Projectile(0, 0, true, 0, 0, 0, ProjectileType.BALL);
    }

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        velX: number,
        velY: number,
	damage: number,
	projectile_type: ProjectileType,
    ) {
        super(x, y, isCenter, projectile_type.entity_type, 0);
        this.vel.x = velX;
        this.vel.y = velY;
	this.damage = damage;
	this.projectile_type = projectile_type;
    }

    injectProjectileData(
        x: number,
        y: number,
        isCenter: boolean,
        velX: number,
        velY: number,
        damage: number,
        projectile_type: ProjectileType,
    ) {
        this.injectEntityData(x, y, isCenter, projectile_type.entity_type, 0);
        this.vel.x = velX;
        this.vel.y = velY;
        this.damage = damage;
        this.projectile_type = projectile_type;
    }

    takeDamage() {
        this.damage -= 1;
        if (this.damage == 0) {
            this.markDead = true;
        }
    }

    draw() {
        switch (this.projectile_type) {
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
            this.pos.x + this.projectile_type.entity_type.size.x < -Game.level!.desc.size.x / 2 ||
            this.pos.x > Game.level!.desc.size.x / 2
        ) {
            this.markDead = true;
        }
        if (
            this.pos.y + this.projectile_type.entity_type.size.y < -Game.level!.desc.size.y / 2 ||
            this.pos.y > Game.level!.desc.size.y / 2
        ) {
            this.markDead = true;
        }
    }
}
