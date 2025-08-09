import { loadTexture } from "./assetManagement.js";
import { Building, BuildingType } from "./building.js";
import { Resources } from "./currency.js";
import { get_element } from "./debug.js";
import { Enemy } from "./enemy.js";
import { Game } from "./game.js";
import { view, Viewport } from "./graphics.js";
import { ProjectileType } from "./projectile.js";
import { find_tower_hit_time } from "./util.js";
import { Vec2 } from "./vector2.js";

interface TowerTypeArgs {
    damage: number;
    shootCooldownMax: number;
    speed: number;
    range: number;
    bullet_type: ProjectileType;
    building_type: BuildingType;
}

export class TowerType {
    static MG_TEXT = loadTexture("mg_turret_base.png");
    static ROCKET_TEXT = loadTexture("rocket_turret_base.png");
    static SNIPER_TEXT = loadTexture("sniper_turret_base.png");
    static MG_HEAD = loadTexture("mg_turret_head.png");
    static SNIPER_HEAD = loadTexture("sniper_turret_head.png");
    static ROCKET_HEAD = loadTexture("rocket_turret_head.png");

    static MG = new TowerType({
	building_type: {
	    entity_type: {
		id: "tower.mg",
		size: new Vec2(48, 48),
		hasHealth: true,
		maxHealth: 50,
		doCollision: false,
	    },
	    cost: new Resources(50, 10),
	    generation: new Resources(0, 0),
	    button_id: "mgButton",
	    info_html: "The machine gun has a very high firerate, but it's aim is terrible. It costs 50 energy and 10 ore.",
	},
        shootCooldownMax: 7,
        damage: 2,
        speed: 6,
        range: 250,
	bullet_type: ProjectileType.BALL,
    });

    static SNIPER = new TowerType({
	building_type: {
	    entity_type: {
		id: "tower.sniper",
		size: new Vec2(32, 32),
		hasHealth: true,
		maxHealth: 50,
		doCollision: false,
	    },
	    cost: new Resources(35, 15),
	    generation: new Resources(0, 0),
	    button_id: "sniperButton",
	    info_html: "The sniper turret takes out enemies reliably. It costs: <span class=\"yellow-text\"> 35 energy </span> and <span class=\"green-text\"> 15 ore </span>",
	},
        shootCooldownMax: 30,
        damage: 6,
        speed: 6,
        range: 400,
	bullet_type: ProjectileType.BALL,
    });

    static ROCKET = new TowerType({
	building_type: {
	    entity_type: {
		id: "tower.rocket",
		size: new Vec2(32, 32),
		hasHealth: true,
		maxHealth: 50,
		doCollision: false,
	    },
	    cost: new Resources(50, 10),
	    generation: new Resources(0, 0),
	    button_id: "rocketButton",
	    info_html: "The machine gun has a high firerate but low damage. It costs: <span class=\"yellow-text\"> 50 energy </span> and <span class=\"green-text\"> 10 ore </span>",
	},
        shootCooldownMax: 20,
        damage: 16,
        speed: 6,
        range: 350,
	bullet_type: ProjectileType.ROCKET,
    });

    static BLASTSHOT = new TowerType({
	building_type: {
	    cost: new Resources(35, 25),
	    entity_type: {
		doCollision: false,
		hasHealth: false,
		maxHealth: 0,
		id: "tower.blastshot",
		size: new Vec2(48, 48),
	    },
	    generation: new Resources(0, 0),
	    button_id: "mgButton",
	    info_html: "The blastshot turret is a big boy. It packs a punch but fires very slowly. It costs: <span class=\"yellow-text\"> 25 energy </span> and <span class=\"green-text\"> 35 ore </span>",
	},
	bullet_type: ProjectileType.BALL,
	damage: 1,
	range: 250,
	shootCooldownMax: 90,
	speed: 6,
    });

    public damage: number;
    public shootCooldownMax: number;
    public speed: number;
    public range: number;
    public bullet_type: ProjectileType;
    public building_type: BuildingType;


    constructor(args: TowerTypeArgs) {
        this.damage = args.damage;
        this.shootCooldownMax = args.shootCooldownMax;
        this.speed = args.speed;
        this.range = args.range;
	this.bullet_type = args.bullet_type;
	this.building_type = args.building_type;

	try {
	    let button = get_element(this.building_type.button_id, HTMLButtonElement);
	    button.children[1].innerHTML = this.building_type.info_html;
	}
	catch {
	    console.warn(`Couldn't find the button for ${this.building_type.entity_type.id} with the id ${this.building_type.button_id}.`);
	}
    }
}

export class Tower extends Building {
    static create_tower_husk(): Tower {
        return new Tower(0, 0, true, TowerType.MG, 0);
    }

    static drawBlueprint(
        view: Viewport,
        centX: number,
        centY: number,
        tower_type: TowerType,
    ) {
        view.fillRect(
            centX - tower_type.building_type.entity_type.size.x / 2,
            centY - tower_type.building_type.entity_type.size.y / 2,
            tower_type.building_type.entity_type.size.x,
            tower_type.building_type.entity_type.size.y,
            "blue",
        );
        view.drawCircleOutline(centX, centY, tower_type.range, "White");
    }

    public tower_type: TowerType;
    public shootCooldown: number = 0;
    public target: Enemy | null = null;
    public rotation: number = Math.random() * 2 * Math.PI;
    /// Where the tower actually aims at
    public shoot_pos: Vec2 = new Vec2(0, 0);

    constructor(
        x: number,
        y: number,
        isCenter: boolean,
        tower_type: TowerType,
        health: number,
    ) {
	super(x, y, isCenter, tower_type.building_type, health);
	this.tower_type = tower_type;
    }

    injectTowerData(
        x: number,
        y: number,
        isCenter: boolean,
        tower_type: TowerType,
        health: number,
    ) {
	this.injectBuildingData(x, y, isCenter, tower_type.building_type, health);
	this.tower_type = tower_type;
	Game.level!.cm.add_tower(this);
    }

    draw() {
        switch (this.tower_type) {
            case TowerType.ROCKET:
		view.drawImageCropped(TowerType.ROCKET_TEXT, this.building_type.entity_type.size.x, this.building_type.entity_type.size.y, this.pos.x, this.pos.y, 0, 0);
		this.drawHead(TowerType.ROCKET_HEAD);
                break;
            case TowerType.MG:
		view.drawImage(TowerType.MG_TEXT, this.pos.x, this.pos.y);
		this.drawHead(TowerType.MG_HEAD);
                break;
            case TowerType.SNIPER:
		view.drawImageCropped(TowerType.SNIPER_TEXT, this.building_type.entity_type.size.x, this.building_type.entity_type.size.y, this.pos.x, this.pos.y, 0, 0);
		this.drawHead(TowerType.SNIPER_HEAD);
                break;
	    case TowerType.BLASTSHOT:
		view.fillRect(this.pos.x, this.pos.y, this.entity_type.size.x, this.entity_type.size.y, "DarkOrchid");
		this.drawHead(TowerType.MG_HEAD);
		break;
	    default:
		throw Error(`Tried to draw entity of type ${this.entity_type.id} but no drawing code was defined for it.`);
        }
    }

    drawHead(head_img: HTMLOrSVGImageElement) {
	if(this.target !== null) {
	    this.rotation = Vec2.subtract(this.shoot_pos, this.center).toRadians();
	}
	let center = this.center;
	view.drawImageRotated(head_img, center.x, center.y, this.rotation);
    }

    update() {
	super.update();
        this.findTarget();

	if(this.target !== null) {
	    this.calc_shoot_pos();
	}

        if (this.shootCooldown <= 0 && this.target !== null) {
	    if(Vec2.subtract(this.shoot_pos, this.center).length <= this.tower_type.range) {
		this.shoot();
		this.shootCooldown = this.tower_type.shootCooldownMax;
	    }
        } else {
            this.shootCooldown -= 1;
        }
    }

    shoot() {
	    //this.target must be nonnull
	    let shoot_velocity = Vec2.subtract(this.shoot_pos, this.center);
	    shoot_velocity.normalize();
	    shoot_velocity.scale(this.tower_type.speed);

	    Game.level!.projectiles.revive_or_create().injectProjectileData(this.centX, this.centY, true, shoot_velocity.x, shoot_velocity.y, this.tower_type.damage, this.tower_type.bullet_type);

	    if(this.tower_type === TowerType.BLASTSHOT) {
		const offset = 0.0125;
		let rotated_velocity_left = Vec2.new_from_angle(shoot_velocity.angle - 2 * Math.PI * offset, shoot_velocity.length);
		Game.level!.projectiles.revive_or_create().injectProjectileData(this.centX, this.centY, true, rotated_velocity_left.x, rotated_velocity_left.y, this.tower_type.damage, this.tower_type.bullet_type);
		let rotated_velocity_left_double = Vec2.new_from_angle(shoot_velocity.angle - 2 * Math.PI * offset * 2, shoot_velocity.length);
		Game.level!.projectiles.revive_or_create().injectProjectileData(this.centX, this.centY, true, rotated_velocity_left_double.x, rotated_velocity_left_double.y, this.tower_type.damage, this.tower_type.bullet_type);
		let rotated_velocity_right = Vec2.new_from_angle(shoot_velocity.angle + 2 * Math.PI * offset, shoot_velocity.length);
		Game.level!.projectiles.revive_or_create().injectProjectileData(this.centX, this.centY, true, rotated_velocity_right.x, rotated_velocity_right.y, this.tower_type.damage, this.tower_type.bullet_type);
		let rotated_velocity_right_double = Vec2.new_from_angle(shoot_velocity.angle + 2 * Math.PI * offset * 2, shoot_velocity.length);
		Game.level!.projectiles.revive_or_create().injectProjectileData(this.centX, this.centY, true, rotated_velocity_right_double.x, rotated_velocity_right_double.y, this.tower_type.damage, this.tower_type.bullet_type);
	    }
    }

    calc_shoot_pos() {
	let hit_time = find_tower_hit_time(this.center, this.target!.center, this.target!.vel, this.tower_type.speed);
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
