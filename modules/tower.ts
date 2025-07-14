import { loadTexture } from "./assetManagement.js";
import { Building, BuildingType, BuildingTypeArgs } from "./building.js";
import { Resources } from "./currency.js";
import { Enemy } from "./enemy.js";
import { Game } from "./game.js";
import { view, Viewport } from "./graphics.js";
import { ProjectileType } from "./projectile.js";
import { find_tower_hit_time, solve_for_t_vec } from "./util.js";
import { Vec2 } from "./vector2.js";

interface TowerTypeArgs extends BuildingTypeArgs {
    damage: number;
    shootCooldownMax: number;
    speed: number;
    range: number;
    bullet_type: ProjectileType;
}

export class TowerType extends BuildingType {
    damage: number;
    shootCooldownMax: number;
    speed: number;
    range: number;
    bullet_type: ProjectileType;

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
        cost: new Resources(50, 10),
        shootCooldownMax: 5,
        damage: 2,
        speed: 6,
        generation: new Resources(0, 0),
        range: 150,
	bullet_type: ProjectileType.BALL,
    });
    static SNIPER = new TowerType({
        size: new Vec2(32, 32),
        hasHealth: true,
        maxHealth: 50,
        doCollision: true,
        cost: new Resources(50, 10),
        shootCooldownMax: 30,
        damage: 6,
        speed: 6,
        generation: new Resources(0, 0),
        range: 300,
	bullet_type: ProjectileType.BALL,
    });
    static ROCKET = new TowerType({
        size: new Vec2(32, 32),
        hasHealth: true,
        maxHealth: 50,
        doCollision: true,
        cost: new Resources(50, 10),
        shootCooldownMax: 20,
        damage: 16,
        speed: 6,
        generation: new Resources(0, 0),
        range: 350,
	bullet_type: ProjectileType.ROCKET,
    });

    constructor(args: TowerTypeArgs) {
        super(args);
        this.damage = args.damage;
        this.shootCooldownMax = args.shootCooldownMax;
        this.speed = args.speed;
        this.cost = args.cost;
        this.range = args.range;
	this.bullet_type = args.bullet_type;
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
    /// Where the tower actually shoots
    public shoot_pos: Vec2 = new Vec2(0, 0);

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
		this.drawHead(TowerType.ROCKET_HEAD);
                break;
            case TowerType.MG:
		view.drawImage(TowerType.MG_TEXT, this.pos.x, this.pos.y);
		this.drawHead(TowerType.MG_HEAD);
                break;
            case TowerType.SNIPER:
		view.drawImageCropped(TowerType.SNIPER_TEXT, this.eType.size.x, this.eType.size.y, this.pos.x, this.pos.y, 0, 0);
		this.drawHead(TowerType.SNIPER_HEAD);
                break;
        }
	//view.fillRect(this.shoot_pos.x - 5, this.shoot_pos.y - 5, 10, 10, "green");
    }

    drawHead(head_img: HTMLOrSVGImageElement) {
	if(this.target !== null) {
	    this.rotation = Vec2.subtract(this.shoot_pos, this.center).toRadians();
	}
	let center = this.center;
	view.drawImageRotated(head_img, center.x, center.y, this.rotation);
    }

    update() {
        this.findTarget();

	if(this.target !== null) {
	    this.calc_shoot_pos();
	}

        if (this.shootCooldown <= 0 && this.target !== null) {
            this.shoot();
            this.shootCooldown = (this.eType as TowerType).shootCooldownMax;
        } else {
            this.shootCooldown -= 1;
        }
    }

    shoot() {
	if(Vec2.subtract(this.shoot_pos, this.center).length <= this.eType.range) {
	    //this.target must be nonnull
	    let target_pos = Vec2.subtract(this.shoot_pos, this.center);
	    target_pos.normalize();
	    target_pos.scale(this.eType.speed);

	    Game.level!.projectiles.reviveOrCreate().injectData(this.centX, this.centY, true, target_pos.x, target_pos.y, this.eType.damage, this.eType.bullet_type);
	}
    }

    calc_shoot_pos() {
	let hit_time = find_tower_hit_time(this.center, this.target!.center, this.target!.vel, this.eType.speed);
	if(!isNaN(hit_time) && hit_time > 0) {
	    let offset = this.target!.vel.copy();
	    offset.scale(hit_time);
	    this.shoot_pos = Vec2.add(this.target!.center, offset);
	} else {
	    this.shoot_pos = this.target!.center;
	}
    }

    findTarget() {
        const potEnem = Game.level!.enemies.getRandom();

        if (potEnem !== undefined) {
	    if(this.is_valid_target(potEnem)) {
		if (this.target === null) {
		    potEnem.addShooter(this);
		    this.target = potEnem;
		} else {
		    let dist = Enemy.getDist(this, this.target!);
		    let nDist = Enemy.getDist(this, potEnem);
		    if (nDist < dist) {
			this.target!.removeShooter(this);
			this.target = potEnem;
			potEnem.addShooter(this);
		    }
		}
	    }
        }
    }

    is_valid_target(enemy: Enemy): boolean {
	return enemy !== null && enemy.lockedOnMe.length === 0;
    }

    notifyTargetDied() {
        this.target = null;
    }
}
