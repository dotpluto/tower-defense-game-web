"use strict";

import { Rect } from "./rectangle.js";
import { Vec2 } from "./vector2.js";
import { CapturableMouseEvent, ScreenManager } from "./screenManager.js";
import { canvas, ctx, view, Viewport } from "./graphics.js";

/**
 * The vertical anchor point of an ui element
 */
export enum VerticalAnchor {
    TOP,
    MIDDLE,
    BOTTOM,
}

export enum HorizontalAnchor {
    LEFT,
    MIDDLE,
    RIGHT,
}

export class Anchor {
    static MIDDLE = new Anchor(VerticalAnchor.MIDDLE, HorizontalAnchor.MIDDLE);
    constructor(vertical: VerticalAnchor, horizontal: HorizontalAnchor) {
        this.vertical = vertical;
        this.horizontal = horizontal;
    }
    vertical: VerticalAnchor;
    horizontal: HorizontalAnchor;
}

export namespace VerticalAnchor {
    export function getPos(anch: VerticalAnchor, pos: number, size: number) {
        switch (anch) {
            case VerticalAnchor.TOP:
                return pos - size / 2;
            case VerticalAnchor.MIDDLE:
                return pos;
            case VerticalAnchor.BOTTOM:
                return pos + size / 2;
        }
    }
}

export function getAnchorOffsetHelper(anchor: Anchor, center: Vec2, size: Vec2) {
	let pos = center.copy();
	switch(anchor.horizontal) {
	    case HorizontalAnchor.LEFT: {
		pos!.x -= size.x / 2;
		break;
	    }
	    case HorizontalAnchor.MIDDLE: {
		break;
	    }
	    case HorizontalAnchor.RIGHT: {
		pos!.x += size.x / 2;
		break;
	    }
	}
	switch(anchor.vertical) {
	    case VerticalAnchor.TOP: {
		pos!.y -= size.y / 2;
		break;
	    }
	    case VerticalAnchor.MIDDLE: {
		break;
	    }
	    case VerticalAnchor.BOTTOM: {
		pos!.y += size.y / 2;
		break;
	    }
	}

	return pos!;
}

// This should be an interface but only classes can have default implementations
export abstract class IUIParent {
    children: UIElement[] = [];
    appendChild(child: UIElement) {
	child.parent = this;
	child.compute();
	this.children.push(child);
    }

    abstract getAnchorPoint(outerAncher: Anchor) : Vec2;
}

export abstract class UIElement extends IUIParent {
    /** The element that this one is attached to. If it is null the element is attached to the canvas. */
    parent: IUIParent|null = null;

    // Where the element is anchored within the parent element
    // like at the top left of the screen
    outerAnchor: Anchor;
    // Where that anchored point is within the element itself
    // If the inner anchor is at the top left the element will put itself in the top left
    innerAnchor: Anchor;

    // Offset added to the parent element anchor
    offset: Vec2;

    // Absolute device pixel size
    size: Vec2;

    children: UIElement[] = [];

    computedCenter: Vec2|null = null;

    constructor(outerAnchor: Anchor, innerAnchor: Anchor, offset: Vec2, size: Vec2) {
	super();
        this.innerAnchor = innerAnchor;
        this.outerAnchor = outerAnchor;
        this.offset = offset;
        this.size = size;
    }

    abstract draw(view: Viewport): void;

    compute() {
	// We take the position of where the anchor is in the parent element and offset it by the inner anchor.
	this.computedCenter = Vec2.subtract(this.parent!.getAnchorPoint(this.outerAnchor), getAnchorOffsetHelper(this.innerAnchor, new Vec2(0, 0), this.size));
	this.computedCenter.add(this.offset);
    }

    override getAnchorPoint(anchor: Anchor): Vec2 {
	return getAnchorOffsetHelper(anchor, this.computedCenter!, this.size);
    }

    getFont(height: number) : string {
	return Math.floor(height).toString() + "px orbitron";
    }

    mouseMoveEvent(_: MouseEvent) { }

    mouseDownEvent(_: CapturableMouseEvent) { }

    mouseUpEvent(_: MouseEvent) { }
}

export class UIText extends UIElement {
    text: string|null;
    font: string;
    padding: Vec2;
    color: string;

    constructor(outerAnchor: Anchor, innerAnchor: Anchor, offset: Vec2, size: Vec2, text: string|null, paddingPercent: Vec2, color: string) {
        super(outerAnchor, innerAnchor, offset, size);
	this.color = color;
	this.text = text;
	this.padding = new Vec2(paddingPercent.x * size.x, paddingPercent.y * size.y);
        this.font = this.getFont(this.size.y - this.padding.y);
	if(text !== null) this.resizeForTxt();
    }

    override draw(_: Viewport) {
	if(this.text !== null) {
	    ctx.font = this.font;
	    ctx.textBaseline = "middle";
	    ctx.textAlign = "center";
	    view.fillText(this.text, this.computedCenter!.x, this.computedCenter!.y, this.color, this.size.x - this.padding.x);
	}
    }
    
    resizeForTxt() {
        ctx.font = this.font;
        const metrics = ctx.measureText(this.text!);
        this.size.x = metrics.width + this.padding.x;
    }
}

export class UIButton extends UIText {
    isHoveredOver: boolean = false;
    clickCallback: (e: MouseEvent) => void;
    background: string|HTMLOrSVGImageElement;

    constructor(outerAnchor: Anchor, innerAnchor: Anchor, size: Vec2, text: string|null, clickCallback: (e: MouseEvent) => void, background: string|HTMLOrSVGImageElement, offset: Vec2) {
	super(outerAnchor, innerAnchor, offset, size, text, new Vec2(0.2, 0.2), "Black");
	this.clickCallback = clickCallback;
	this.background = background;
    }

    draw() {
	const inset = 8;
	if(!this.isHoveredOver) {
	    if(typeof(this.background) === "object") {
		view.drawImageCropped(this.background, this.size.x, this.size.y, this.computedCenter!.x - this.size.x / 2, this.computedCenter!.y - this.size.y / 2, 0, 0);
	    } else {
		view.fillRect(this.computedCenter!.x - this.size.x / 2, this.computedCenter!.y - this.size.y / 2, this.size.x, this.size.y, this.background);
	    }
	} else {
	    view.fillRect(this.computedCenter!.x - this.size.x / 2, this.computedCenter!.y - this.size.y / 2, this.size.x, this.size.y, "White")
	    if(typeof(this.background) === "string") {
		view.fillRect(this.computedCenter!.x - this.size.x / 2 + inset / 2, this.computedCenter!.y - this.size.y / 2 + inset / 2, this.size.x - inset, this.size.y - inset, this.background);
	    } else {
		view.drawImageCropped(this.background, this.size.x - inset, this.size.y - inset, this.computedCenter!.x - this.size.x / 2 + inset / 2, this.computedCenter!.y - this.size.y / 2 + inset / 2, inset / 2, inset / 2);
	    }
	}
        super.draw(view);
    }

    mouseMoveEvent(e: MouseEvent) {
        let buttonRect = new Rect(this.computedCenter!.x - this.size.x / 2, this.computedCenter!.y - this.size.y / 2, this.size.x, this.size.y);
        let mousePos = new Vec2(view.viewToWorldX(e.clientX * window.devicePixelRatio), view.viewToWorldY(e.clientY * window.devicePixelRatio));
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
        const rect = new Rect(this.computedCenter!.x - this.size.x / 2, this.computedCenter!.y - this.size.y / 2, this.size.x, this.size.y);
        if (rect.isPointInside(new Vec2(view.viewToWorldX(e.clientX * window.devicePixelRatio), view.viewToWorldY(e.clientY * window.devicePixelRatio)))) {
            this.clickCallback(e);
            CapturableMouseEvent.capture(e);
        }
    }
}

export class UIScore extends UIElement  {
    getScore: () => string;
    color: string;
    font: string;
    text: string;
    constructor(innerAnchor: Anchor, outerAnchor: Anchor, size: Vec2, offset: Vec2, getScore: () => string, color: string, text: string) {
        super(outerAnchor, innerAnchor, offset, size);
	this.getScore = getScore;
	this.color = color;
	this.font = this.getFont(this.size.y / 2);
	this.text = text;
    }

    draw(): void {
	ctx.font = this.font;
	ctx.textBaseline = "middle";
	ctx.textAlign = "center";
	view.fillText(this.text, this.computedCenter!.x, this.computedCenter!.y - this.size.y / 4, this.color, this.size.x);
	view.fillText(this.getScore(), this.computedCenter!.x, this.computedCenter!.y + this.size.y / 4, this.color, this.size.x);
    }
}
