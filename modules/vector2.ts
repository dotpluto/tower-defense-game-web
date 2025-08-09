"use strict";

/*
 * This is both the vector class and support for vector operations while avoiding object allocation.
*/
export class Vec2 {
	//return "registers" for objectless vector manipulation
	static numX: number = 0;
	static numY: number = 0;

	//for non class vectors
	static numNormalize(x: number, y: number) {
		const length = this.numLength(x, y);
		Vec2.numX = x / length;
		Vec2.numY = y / length;
	}

	static numScale(x: number, y: number, scalar: number) {
		Vec2.numX = x * scalar;
		Vec2.numY = y * scalar;
	}

	static numLength(x: number, y: number) {
		return Math.sqrt(x*x + y*y);
	}

	static numRandomUnit() {
		this.numNormalize(2 * Math.random() - 1 , 2 * Math.random() - 1);
	}

    constructor(
        public x: number,
        public y: number,
    ) {}

    static add(a: Vec2, b: Vec2): Vec2 {
        return new Vec2(a.x + b.x, a.y + b.y);
    }

    static subtract(a: Vec2, b: Vec2): Vec2 {
        return new Vec2(a.x - b.x, a.y - b.y);
    }

    static scaleVec(v: Vec2, scale: number) {
        return new Vec2(v.x * scale, v.y * scale);
    }

    static new_from_angle(angle: number, length: number) {
	return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length);
    }

    static getRandomUnitVec(): Vec2 {
        let vecAsRad = Math.random() * 2 * Math.PI;
        return new Vec2(Math.cos(vecAsRad), Math.sin(vecAsRad));
    }

    static doVectorSquaresIntersect(
        posA: Vec2,
        sizeA: Vec2,
        posB: Vec2,
        sizeB: Vec2,
    ): boolean {
        if (posA.x + sizeA.x > posB.x && posA.x < posB.x + sizeB.x && posA.y + sizeA.x > posB.y && posA.y < posB.y + sizeB.y) {
            return true;
        }

        return false;
    }


    get length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    getNormalized(): Vec2 {
        return new Vec2(this.x / this.length, this.y / this.length);
    }

    normalize() {
		let length = this.length;
        this.x /= length;
        this.y /= length;
    }

    scale(scalar: number) {
        this.x *= scalar;
        this.y *= scalar;
    }

    add(vec: Vec2) {
        this.x += vec.x;
        this.y += vec.y;
    }

    copy() : Vec2 {
	return new Vec2(this.x, this.y);
    }

    toRadians(): number {
	return Math.atan2(this.y, this.x);
    }

    get angle(): number {
	return Math.atan2(this.y, this.x);
    }
}
