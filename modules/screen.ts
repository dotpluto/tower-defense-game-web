import {
    /* 
    UIText,
    HAnchPoint,
    VerticalAnchor,
    UIButton,
    UIElement,
    UIIconButton,
    addChild,
    UIScore,
    */
    UIElement,
    IUIParent,
    Anchor,
    getAnchorOffsetHelper,
    VerticalAnchor,
    HorizontalAnchor,
    UIText,
    UIButton,
    UIScore,
} from "./uiElement.js";
import { Vec2 } from "./vector2.js";
import { CapturableMouseEvent, ScreenManager } from "./screenManager.js";
import { Game } from "./game.js";
import { canvas, ctx, Viewport, view } from "./graphics.js";
import { loadTexture } from "./assetManagement.js";
import { TowerType } from "./tower.js";
import { BuildingType } from "./building.js";

export abstract class Screen extends IUIParent {
    constructor(public liveRendering: boolean) {
        super();
    }

    draw(view: Viewport) {
        this.children.forEach((e) => {
            e.draw(view);
        });
    }

    open(_: Viewport) { }
    close() { }

    //event passdowns
    mouseMoveEvent(event: MouseEvent) {
        for (const elem of this.children) {
            elem.mouseMoveEvent(event);
        }
    }

    mouseUpEvent(event: MouseEvent) {
        for (const elem of this.children) {
            elem.mouseUpEvent(event);
        }
    }

    mouseDownEvent(event: CapturableMouseEvent) {
        for (const elem of this.children) {
            elem.mouseDownEvent(event);
        }
    }

    mouseLeaveEvent(event: MouseEvent) {
    }

    resizeEvent() {
        for (const elem of this.children) {
            elem.compute();
        }
    }

    getAnchorPoint(anchor: Anchor): Vec2 {
        return getAnchorOffsetHelper(anchor, new Vec2(0, 0), new Vec2(canvas.width, canvas.height));
    }

}

export class StartScreen extends Screen {
    constructor() {
        super(false);
        this.appendChild(new UIButton(new Anchor(VerticalAnchor.MIDDLE, HorizontalAnchor.MIDDLE), new Anchor(VerticalAnchor.MIDDLE, HorizontalAnchor.MIDDLE), new Vec2(100, 120), "Play", () => { ScreenManager.setActiveScreen(ScreenManager.GAME_SCREEN) }, "Red", new Vec2(0, 0)));
    }

    draw(view: Viewport) {
        ctx.fillStyle = "Black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        super.draw(view);
    }

    open(view: Viewport) {
        this.draw(view);
    }
}

export class EndScreen extends Screen {
    constructor() {
        super(false);
        /*
        this.children.push(
            UIText.new({
                vertical: VAnchPoint.MIDDLE,
                horizontal: HAnchPoint.MIDDLE,
                offset: new Vec2(0, 0),
                size: new Vec2(0, 96),
                text: "Game Over",
            }),
        );
        this.children.push(
            UIButton.new({
                vertical: VAnchPoint.MIDDLE,
                horizontal: HAnchPoint.MIDDLE,
                offset: new Vec2(0, 48 + 32),
                size: new Vec2(0, 64),
                text: "Retry",
                clickCallback: () => {
                    ScreenManager.setActiveScreen(ScreenManager.GAME_SCREEN);
                },
            }),
        );
        */
    }

    draw(view: Viewport) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        super.draw(view);
    }
    open(view: Viewport) {
        this.draw(view);
    }
}

export class GameScreen extends Screen {
    static mgIcon = loadTexture("mg_button.png");
    static sniperIcon = loadTexture("sniper_button.png");

    isMouseDown: boolean = false;
    isMoveDragging: boolean = false;
    lastDragX: number = 0;
    lastDragY: number = 0;

    lastMouseX: number = 0;
    lastMouseY: number = 0;

    constructor() {
        super(true);
        Game.screen = this;

	//buttons
	this.appendChild(new UIButton(new Anchor(VerticalAnchor.BOTTOM, HorizontalAnchor.MIDDLE), new Anchor(VerticalAnchor.BOTTOM, HorizontalAnchor.MIDDLE), new Vec2(50, 50), null, () => { Game.selBuildingType = TowerType.MG}, loadTexture("mg_button.png"), new Vec2(-2.5 + -25, 0)));
	this.appendChild(new UIButton(new Anchor(VerticalAnchor.BOTTOM, HorizontalAnchor.MIDDLE), new Anchor(VerticalAnchor.BOTTOM, HorizontalAnchor.MIDDLE), new Vec2(50, 50), null, () => { Game.selBuildingType = TowerType.SNIPER }, loadTexture("sniper_button.png"), new Vec2(2.5 + 25, 0)));
	this.appendChild(new UIButton(new Anchor(VerticalAnchor.BOTTOM, HorizontalAnchor.MIDDLE), new Anchor(VerticalAnchor.BOTTOM, HorizontalAnchor.MIDDLE), new Vec2(50, 50), null, () => { Game.selBuildingType = TowerType.ROCKET }, loadTexture("rocket_button.png"), new Vec2(-7.5 + -75, 0)));
	this.appendChild(new UIButton(new Anchor(VerticalAnchor.BOTTOM, HorizontalAnchor.MIDDLE), new Anchor(VerticalAnchor.BOTTOM, HorizontalAnchor.MIDDLE), new Vec2(50, 50), null, () => {  }, loadTexture("upgrade_reactor_button.png"), new Vec2(7.5 + 75, 0)));
	//scores
	this.appendChild(new UIScore(new Anchor(VerticalAnchor.TOP, HorizontalAnchor.MIDDLE), new Anchor(VerticalAnchor.TOP, HorizontalAnchor.MIDDLE), new Vec2(200, 100), new Vec2(200, 10), () => { return Math.round(Game.level!.currency.owned.nilrun * 10) / 10 + "" }, "Green", "ore:"));
	this.appendChild(new UIScore(new Anchor(VerticalAnchor.TOP, HorizontalAnchor.MIDDLE), new Anchor(VerticalAnchor.TOP, HorizontalAnchor.MIDDLE), new Vec2(200, 100), new Vec2(-200, 10), () => { return Math.round(Game.level!.currency.owned.energy * 10) / 10 + "" }, "Yellow", "energy:"));
    }

    open(_: Viewport) {
        Game.init();
        Game.doFrame();
    }

    draw(view: Viewport) {
        Game.doFrame();
        super.draw(view);
    }

    mouseUpEvent(_: MouseEvent): void {
        this.isMouseDown = false;
        this.isMoveDragging = false;
    }

    mouseDownEvent(event: CapturableMouseEvent): void {
        super.mouseDownEvent(event);
        this.isMouseDown = true;
        if (!CapturableMouseEvent.checkCaptured(event)) {
            if (event.button === 0) {
                Game.placeTower();
            } else if (event.button === 2) {
		Game.checkMouseInteract()
                //this.isMoveDragging = !Game.checkMouseInteract();
                if (this.isMoveDragging) {
                    this.lastDragX = event.clientX;
                    this.lastDragY = event.clientY;
                }
            }
        }
    }

    mouseMoveEvent(event: MouseEvent): void {
	super.mouseMoveEvent(event);
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        if (this.isMouseDown && this.isMoveDragging) {
            Game.moveView(
                event.clientX - this.lastDragX,
                event.clientY - this.lastDragY,
            );
            this.lastDragX = event.clientX;
            this.lastDragY = event.clientY;
        }
    }

    mouseLeaveEvent(_: MouseEvent): void {
        this.isMouseDown = false;
        this.isMoveDragging = false;
    }
}
