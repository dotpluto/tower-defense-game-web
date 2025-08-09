import { do_rect_and_circle_collide } from "./collision.js";
import { Entity } from "./entity.js";
import { ctx, view } from "./graphics.js";
import { Level } from "./level";
import { Tower } from "./tower.js";

//section count
const sectionSizeHint = 100; //the wanted chunk size

export class SectionData {
    public entities: Entity[];
    public towers: Set<Tower>;

    constructor() {
        this.entities = [];
        this.towers = new Set();
    }
}

/*
 * 2d array of squares to save collsion time
 * centered on the level.
 * Chunks range from -x to x where x is the total chunk number divided by two.
 */
export class CollisionMap {
    static return_origin_chunk_x: number = 0;
    static return_origin_chunk_y: number = 0;
    static return_chunk_num_x: number = 0;
    static return_chunk_num_y: number = 0;

    //how many chunks there are per axis
    chNumX: number;
    chNumY: number;

    //how big chunks are per dimension (might vary)
    chSizeX: number;
    chSizeY: number;

    section_grid: SectionData[][];

    constructor(public mapWidth: number, public mapHeight: number) {
        //determininig size and making it divisible by two
        this.chNumX = Math.ceil(mapWidth / sectionSizeHint);
        if (this.chNumX % 2 === 1) {
            this.chNumX += 1;
        }
        this.chNumY = Math.ceil(mapHeight / sectionSizeHint);
        if (this.chNumY % 2 === 1) {
            this.chNumY += 1;
        }

        this.chSizeX = mapWidth / this.chNumX;
        this.chSizeY = mapHeight / this.chNumY;

        this.section_grid = [];
        for (let i = 0; i < this.chNumX; i++) {
            let rows = [];
            for (let j = 0; j < this.chNumY; j++) {
                rows.push(new SectionData());
            }
            this.section_grid.push(rows);
        }

    }

    reset() {
        for (let x = 0; x < this.chNumX; x++) {
            for (let y = 0; y < this.chNumY; y++) {
                this.section_grid[x][y].entities = [];
            }
        }
    }

    add_entity(entity: Entity) {
        entity.sections = [];

        this.get_chunks_in_rect(entity.pos.x, entity.pos.y, entity.entity_type.size.x, entity.entity_type.size.y);

        for (let x = 0; x < CollisionMap.return_chunk_num_x; x++) {
            for (let y = 0; y < CollisionMap.return_chunk_num_y; y++) {
                let ch_x = x + CollisionMap.return_origin_chunk_x;
                let ch_y = y + CollisionMap.return_origin_chunk_y;
                if (this.does_chunk_exist(ch_x, ch_y)) {
                    this.section_grid[ch_x][ch_y].entities.push(entity);
                    entity.sections.push(this.section_grid[ch_x][ch_y]);
                    entity.update_towers(CollisionMap.return_origin_chunk_x,
                        CollisionMap.return_origin_chunk_y,
                        CollisionMap.return_chunk_num_x,
                        CollisionMap.return_chunk_num_y);
                }
            }
        }
    }

    public add_tower(tower: Tower) {
        let tower_center_x = tower.pos.x + tower.entity_type.size.x / 2;
        let tower_center_y = tower.pos.y + tower.entity_type.size.y / 2;
        this.get_chunks_in_rect(tower_center_x - tower.tower_type.range, tower_center_y - tower.tower_type.range, tower.tower_type.range * 2, tower.tower_type.range * 2);
        for (let x = 0; x < CollisionMap.return_chunk_num_x; x++) {
            for (let y = 0; y < CollisionMap.return_chunk_num_y; y++) {
                let ch_x = x + CollisionMap.return_origin_chunk_x;
                let ch_y = y + CollisionMap.return_origin_chunk_y;
                if (this.does_chunk_exist(ch_x, ch_y) &&
                    do_rect_and_circle_collide(tower_center_x,
                        tower_center_y,
                        tower.tower_type.range,
                        this.get_chunk_pos_x(ch_x),
                        this.get_chunk_pos_y(ch_y),
                        this.chSizeX,
                        this.chSizeY

                    )
                ) {
                    this.section_grid[ch_x][ch_y].towers.add(tower);
                }
            }
        }
    }

    public does_chunk_exist(x: number, y: number) {
        return x >= 0 && x < this.chNumX && y >= 0 && y < this.chNumY;
    }

    public get_chunks_in_rect(x: number, y: number, width: number, height: number) {

        CollisionMap.return_origin_chunk_x = this.getChunkFromPointX(x);
        CollisionMap.return_origin_chunk_y = this.getChunkFromPointY(y);

        //the smallest an enemy can be is a point so it must occupy at least one chunk
        let occupied_chunks_x = 1;
        let occupied_chunks_y = 1;


        occupied_chunks_x += Math.floor(width / this.chSizeX);
        occupied_chunks_y += Math.floor(height / this.chSizeY);

        const leftFlipped =
            x < 0
                ? this.chSizeX - Math.abs(x % this.chSizeX)
                : x;
        const topFlipped =
            y < 0
                ? this.chSizeY - Math.abs(y % this.chSizeY)
                : y;

        const inChunkDistX = leftFlipped % this.chSizeX;
        const inChunkDistY = topFlipped % this.chSizeY;

        if (inChunkDistX + (width % this.chSizeX) >= this.chSizeX)
            occupied_chunks_x += 1;
        if (inChunkDistY + (width % this.chSizeY) >= this.chSizeY)
            occupied_chunks_y += 1;

        CollisionMap.return_chunk_num_x = occupied_chunks_x;
        CollisionMap.return_chunk_num_y = occupied_chunks_y;
    }

    //gets chunks but doesn't validate wheter they are inside of the map
    getChunkFromPointX(x: number) {
        return Math.floor(x / this.chSizeX) + this.chNumX / 2;
    }

    //gets chunks but doesn't validate wheter they are inside of the map
    getChunkFromPointY(y: number): number {
        return Math.floor(y / this.chSizeY) + this.chNumY / 2;
    }

    //get left of chunk with that pos
    get_chunk_pos_x(chPos: number): number {
        return chPos * this.chSizeX - this.chNumX / 2 * this.chSizeX;
    }

    //get top of chunk with that pos
    get_chunk_pos_y(chPos: number): number {
        return chPos * this.chSizeY - this.chNumY / 2 * this.chSizeY;
    }

    getChunkOffsetX(x: number): number {
        if (x >= 0) {
            return x % this.chSizeX;
        } else {
            return (x % this.chSizeX) - this.chSizeX;
        }
    }

    getChunkOffsetY(y: number): number {
        if (y >= 0) {
            return y % this.chSizeY;
        } else {
            return (y % this.chSizeY) - this.chSizeY;
        }
    }

    debugDraw(level: Level) {
        //make chunks with things in it colored
        for (let chunkX = 0; chunkX < this.chNumX; chunkX++) {
            for (let chunkY = 0; chunkY < this.chNumY; chunkY++) {
                const entities = this.section_grid[chunkX][chunkY].entities;
                const color = entities.length > 0 ? "white" : "grey";
                view.fillRect(this.get_chunk_pos_x(chunkX), this.get_chunk_pos_y(chunkY), this.chSizeX, this.chSizeY, color);
                if (this.section_grid[chunkX][chunkY].towers.size) {
                    view.fillRect(this.get_chunk_pos_x(chunkX) + this.chSizeX / 4, this.get_chunk_pos_y(chunkY) + this.chSizeY / 4, this.chSizeX / 2, this.chSizeY / 2, "green");
                }
            }
        }

        //draw lines
        ctx.strokeStyle = "blue";
        ctx.beginPath();

        const worldLeft = 0 - level.desc.size.x / 2;
        const worldTop = 0 - level.desc.size.y / 2;
        const worldBot = worldTop + level.desc.size.y;
        const worldRight = worldLeft + level.desc.size.x;

        //vertical lines
        view.moveTo(worldLeft, worldTop);
        view.lineTo(worldLeft, worldBot);
        let worldXOff = 0;
        for (let chunkX = 0; chunkX < this.chNumX; chunkX++) {
            worldXOff += this.chSizeX;
            view.moveTo(worldLeft + worldXOff, worldTop);
            view.lineTo(worldLeft + worldXOff, worldBot);
        }

        //horizontal age
        view.moveTo(worldLeft, worldTop);
        view.lineTo(worldRight, worldTop);
        let worldYOff = 0;
        for (let chunkY = 0; chunkY < this.chNumY; chunkY++) {
            worldYOff += this.chSizeY;
            view.moveTo(worldLeft, worldTop + worldYOff);
            view.lineTo(worldRight, worldTop + worldYOff);
        }
        ctx.stroke();

    }
}
