"use strict";

import { Rect } from "./rectangle.js";
import { Vec2 } from "./vector2.js";
import { CapturableMouseEvent, ScreenManager } from "./screenManager.js";
import { canvas, ctx, Display } from "./graphics.js";

export interface IUIParent {
	children: UIElement[];
}

export function addChild<C extends UIElement>(parent: IUIParent, factory: (parent: IUIParent) => C): C {
	const child = factory(parent);
	parent.children.push(child);
	return child;
}

/**
 * The horizontal anchor point of a ui element
 */
export enum HAnchPoint {
    LEFT,
    MIDDLE,
    RIGHT,
}

export namespace HAnchPoint {
    export function getPos(anch: HAnchPoint, pos: number, size: number) {
        switch (anch) {
            case HAnchPoint.LEFT:
                return pos - size / 2;
            case HAnchPoint.MIDDLE:
                return pos;
            case HAnchPoint.RIGHT:
                return pos + size / 2;
        }
    }
}

/**
 * The vertical anchor point of an ui element
 */
export enum VAnchPoint {
    TOP,
    MIDDLE,
    BOTTOM,
}

export namespace VAnchPoint {
    export function getPos(anch: VAnchPoint, pos: number, size: number) {
        switch (anch) {
            case VAnchPoint.TOP:
                return pos - size / 2;
            case VAnchPoint.MIDDLE:
                return pos;
            case VAnchPoint.BOTTOM:
                return pos + size / 2;
        }
    }
}

interface UIElementArgs {
    parent: IUIParent;
    parHorAnch: HAnchPoint;
    parVerAnch: VAnchPoint;
    horAnch: HAnchPoint;
    verAnch: VAnchPoint;
    offset: Vec2;
    size: Vec2;
}

/**
 * The UIElement is always positionted relative to its parent element.
 */
export abstract class UIElement implements IUIParent {
    /** The element that this one is attached to. If it is null the element is attached to the canvas. */
    parent: IUIParent;

    /** Position of the anchor on the parent element in the horizontal axis */
    parHorAnch: HAnchPoint;

    /** Position of the anchor on the parent element in the vertical axis */
    parVerAnch: VAnchPoint;

    /** Position of the anchor on the current element in the horizontal axis */
    horAnch: HAnchPoint;

    /** Position of the anchor on the current element in the vertical axis */
    verAnch: VAnchPoint;

    /** Screen coordinate offset after other transformations */
    offset: Vec2;

    size: Vec2;

    /** The position cache computed from the current state */
    computed: Vec2;

	children: UIElement[] = [];

    constructor({
        parent,
        parVerAnch,
        parHorAnch,
        verAnch,
        horAnch,
        offset,
        size,
    }: UIElementArgs) {
        this.parent = parent;
        this.parHorAnch = parHorAnch;
        this.parVerAnch = parVerAnch;
        this.horAnch = horAnch;
        this.verAnch = verAnch;
        this.offset = offset;
        this.size = size;
        this.computed = new Vec2(0, 0);
		this.computePos();
    }

    computePos() {
        let parX;
        let parY;
        let parSizeX;
        let parSizeY;

        if (this.parent instanceof UIElement) {
			const p = this.parent as UIElement;
            parX = p.computed.x;
            parY = p.computed.y;
            parSizeX = p.size.x;
            parSizeY = p.size.y;
        } else {
            parX = 0 + Display.width / 2;
            parY = 0 + Display.height / 2;
            parSizeX = Display.width;
            parSizeY = Display.height;
        }

        const parAnchX = HAnchPoint.getPos(this.parHorAnch, parX, parSizeX);
        const parAnchY = VAnchPoint.getPos(this.parVerAnch, parY, parSizeY);

        this.computed.x =
            parAnchX -
            HAnchPoint.getPos(this.horAnch, 0, this.size.x) +
            this.offset.x;
        this.computed.y =
            parAnchY -
            VAnchPoint.getPos(this.verAnch, 0, this.size.y) +
            this.offset.y;

		for(const child of this.children) {
			child.computePos();
		}
    }

    abstract draw(): void;

    mouseMoveEvent(_: MouseEvent) {}

    mouseDownEvent(_: CapturableMouseEvent) {}

    mouseUpEvent(_: MouseEvent) {}
}

interface UITextArgs extends UIElementArgs {
    text: string;
	resizeForTxt: boolean;
}

export class UIText extends UIElement {
    text: string;
	font: string;
    static new(args: UITextArgs): UIText {
        return new UIText(args);
    }

    constructor(args: UITextArgs) {
        super(args);
        this.text = args.text;

		this.font = Math.floor(this.size.y).toString() + "px orbitron";
		if(args.resizeForTxt) this.resizeForTxt();
    }

    draw(color?: string) {
		ctx.font = this.font;
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillStyle = color || "red";
		ctx.fillText(this.text, this.computed.x, this.computed.y, this.size.x);
    }

	resizeForTxt() {
		ctx.font = this.font;
		const metrics = ctx.measureText(this.text);
		this.size.x = metrics.width;
	}
}

export interface UIButtonArgs extends UITextArgs {
    clickCallback: (e: MouseEvent) => void;
}

export class UIButton extends UIText {
    isHoveredOver: boolean = false;
    clickCallback: (e: MouseEvent) => void;

    static new(args: UIButtonArgs) {
        return new UIButton(args);
    }

    constructor(args: UIButtonArgs) {
        super(args);
        this.clickCallback = args.clickCallback;
    }

    draw() {
		super.draw(this.isHoveredOver? "white" : "red");
    }

    mouseMoveEvent(e: MouseEvent) {
		//TODO fix
        let buttonRect = new Rect(this.computed.x - this.size.x / 2, this.computed.y - this.size.y / 2, this.size.x, this.size.y);
        let mousePos = new Vec2(e.clientX, e.clientY);
        if (this.isHoveredOver === false) {
            if (buttonRect.isPointInside(mousePos)) {
                this.isHoveredOver = true;
                ScreenManager.markForRedraw();
            }
        } else {
            if (!buttonRect.isPointInside(mousePos)) {
                this.isHoveredOver = false;
                ScreenManager.markForRedraw();
            }
        }
    }

    mouseDownEvent(e: CapturableMouseEvent) {
		//TODO fix
		const rect = new Rect(this.computed.x - this.size.x / 2, this.computed.y - this.size.y / 2, this.size.x, this.size.y);
        if (rect.isPointInside(new Vec2(e.clientX, e.clientY))) {
            this.clickCallback(e);
			CapturableMouseEvent.capture(e);
        }
    }
}

export interface UIIconButtonArgs extends UIButtonArgs {
    icon: HTMLOrSVGImageElement;
}

export class UIIconButton extends UIButton {
    icon: HTMLOrSVGImageElement;
    constructor(args: UIIconButtonArgs) {
        super(args);
        this.icon = args.icon;
    }

    draw(): void {
        ctx.drawImage(
            this.icon,
            this.computed.x - this.size.x / 2,
            this.computed.y - this.size.y / 2,
            this.size.x,
            this.size.y,
        );
    }
}

export interface UIScoreArgs extends UITextArgs {
	getScore: () => string;
	color: string;
}

export class UIScore extends UIText{
	getScore: () => string;
	color: string;
	static new(args: UIScoreArgs) {
		return new UIScore(args);
	}
	constructor(args: UIScoreArgs) {
		super(args);
		this.getScore = args.getScore;
		this.color = args.color;
	}

	draw(color?: string): void {
		this.text = this.getScore();
		this.resizeForTxt();
		super.draw(this.color);
	}


}
