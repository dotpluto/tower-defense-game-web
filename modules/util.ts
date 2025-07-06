import { Vec2 } from "./vector2.js";

/* Deletes the element in an UNSORTED collection.
 * Assumes one or more elements.
*/
export function fastDelete(deleteInd: number, array: any[]): void {
    const lastInd = array.length - 1;
    array[deleteInd] = array[lastInd];
    array.pop();
}
/**
 * A extension of the vanilla array that hopes to be a little more efficient.
 */
export class EffArray<T> extends Array<T> {
    /**
     * Deleting at specified index of this array. This doesn't preserve the array order.
     */
    unorderedDelete(delInd: number) {
        const lastInd = this.length - 1;
        this[delInd] = this[lastInd];
        this.pop();
    }

    /**
      * Clearing this array a bit more efficient.
      */
    clear() {
        for (let i = this.length; i > 0; i--) {
            this.pop();
        }
    }
}

export function solve_for_t(a_pos: number, b_pos: number, a_vel: number, b_vel: number) {
    return b_pos - a_pos / a_vel - b_vel;
}

export function solve_for_t_vec(a_pos: Vec2, b_pos: Vec2, a_vel: Vec2, b_vel: Vec2): Vec2 {
    return new Vec2(solve_for_t(a_pos.x, b_pos.x, a_vel.x, b_vel.x), solve_for_t(a_pos.y, b_pos.y, a_vel.y, b_vel.y));
}

// export function equal_with_error(num_a: number, num_b: number, error: number): number {
//     //TODO
//     //return num_a + error > num_b && num_a - error < num_b; }

export function find_tower_hit_time(tower_pos: Vec2, enemy_start_pos: Vec2, enemy_vel: Vec2,
    projectile_speed: number): number {
    let enemy_start_pos_rel: any = Vec2.subtract(enemy_start_pos, tower_pos);
    let a = Math.pow(enemy_vel.x, 2) + Math.pow(enemy_vel.y, 2) - Math.pow(projectile_speed, 2);
    let b = 2 * enemy_start_pos_rel.x * enemy_vel.x + 2 * enemy_start_pos_rel.y * enemy_vel.y;
    let c = Math.pow(enemy_start_pos_rel.x, 2) + Math.pow(enemy_start_pos_rel.y, 2);
    let t1 = (-b + Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
    let t2 = (-b - Math.sqrt(Math.pow(b, 2) - 4 * a * c)) / (2 * a);
    if(t1 >= 0 && t2 >= 0) {
	return Math.min(t1, t2);
    } else if(t1 >= 0) {
	return t1;
    } else if(t2 >= 0) {
	return t2;
    } else {
	return -1;
    }
}
