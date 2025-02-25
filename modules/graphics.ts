import { Vec2 } from "modules/vector2.js";

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d", {
    alpha: true,
    antialias: false,
}) as CanvasRenderingContext2D;

/**
 * Class that represents a viewpoint.
 * It's size is equal to the size of the canvas.
 */
export class Viewport {
    constructor(public center: Vec2) {}

    drawImage(img: HTMLOrSVGImageElement, left: number, top: number) {
        ctx.drawImage(img, this.worldToViewX(left), this.worldToViewY(top));
    }

    fillRect(left: number, top: number, w: number, h: number, color: string) {
        ctx.fillStyle = color;
        ctx.fillRect(this.worldToViewX(left), this.worldToViewY(top), w, h);
    }

	drawCircleOutline(cLeft: number, cTop: number, radius: number, color: string) {
		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.arc(this.worldToViewX(cLeft), this.worldToViewY(cTop), radius, 0, 2 * Math.PI);
		ctx.stroke();
	}

	moveTo(x: number, y: number) {
		ctx.moveTo(this.worldToViewX(x), this.worldToViewY(y));
	}

	lineTo(x: number, y: number) {
		ctx.lineTo(this.worldToViewX(x), this.worldToViewY(y));
	}


    worldToViewX(worldX: number) {
        return worldX + this.width / 2 - this.center.x;
    }

    worldToViewY(worldY: number) {
        return worldY + this.height / 2 - this.center.y;
    }

	viewToWorldX(viewX: number) {
		return viewX - this.width / 2 + this.center.x;
	}

	viewToWorldY(viewY: number) {
		return viewY - this.height / 2 + this.center.y;
	}

    get width() {
		return Display.width;
    }

    get height() {
		return Display.height;
    }
}

export class Display {
	static get width() {
		return canvas.width;
	}

	static get height() {
		return canvas.height;
	}
}
