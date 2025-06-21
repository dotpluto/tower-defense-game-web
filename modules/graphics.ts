import { Vec2 } from "./vector2.js";

export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
export const ctx = canvas.getContext("2d", {
    alpha: true,
    antialias: false,
}) as CanvasRenderingContext2D;
ctx.imageSmoothingEnabled = false;


/**
 * Class that represents a viewpoint.
 * It's size is equal to the size of the canvas.
 */
export class Viewport {
    constructor(public center: Vec2) {}

    drawImage(img: HTMLOrSVGImageElement, left: number, top: number) {
        ctx.drawImage(img, Math.floor(this.worldToViewX(left)), Math.floor(this.worldToViewY(top)));
    }

    drawImageCropped(img: HTMLOrSVGImageElement, width: number, height: number, x: number, y: number, offX: number, offY: number) {
	ctx.drawImage(img, offX, offY, width, height, Math.floor(this.worldToViewX(x)), Math.floor(this.worldToViewY(y)), width, height);
    }

    fillRect(left: number, top: number, w: number, h: number, color: string) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(this.worldToViewX(left)), Math.floor(this.worldToViewY(top)), w, h);
    }

    fillText(text: string, x: number, y: number, color: string, maxWidth:number|undefined) {
	ctx.fillStyle = color;
	ctx.fillText(text, Math.floor(this.worldToViewX(x)), Math.floor(this.worldToViewY(y)), maxWidth);
    }

    drawCircleOutline(cLeft: number, cTop: number, radius: number, color: string) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.arc(Math.floor(this.worldToViewX(cLeft)), Math.floor(this.worldToViewY(cTop)), radius, 0, 2 * Math.PI);
        ctx.stroke();
    }

    moveTo(x: number, y: number) {
        ctx.moveTo( Math.floor(this.worldToViewX(x)), Math.floor(this.worldToViewY(y)));
    }

    lineTo(x: number, y: number) {
        ctx.lineTo( Math.floor(this.worldToViewX(x)), Math.floor(this.worldToViewY(y)));
    }

    drawPoint(x: number, y: number) {
	ctx.fillStyle = "white";
	ctx.fillRect( Math.floor(this.worldToViewX(x)), Math.floor(this.worldToViewY(y)), 1, 1);
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
        return canvas.width;
    }

    get height() {
        return canvas.height;
    }
}

export const view: Viewport = new Viewport(new Vec2(0, 0));
