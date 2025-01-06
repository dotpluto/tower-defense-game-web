import {
    UIText,
    HorizontalAnchorPoint,
    VerticalAnchorPoint,
    UIButton,
    UIElement,
    UIIconButton,
} from "modules/uiElement.js";
import { Vec2 } from "modules/vector2.js";
import { ScreenManager } from "modules/screenManager.js";
import { Game } from "modules/game.js";
import { canvas, ctx } from "modules/graphics.js";
import { loadTexture } from "modules/assetManagement.js";
import { Rect } from "modules/rectangle.js";
import { TowerType } from "modules/entity.js";

export enum EventState {
    CAPTURED,
    UNCAPTURED,
}

export abstract class Screen {
    uiElements: UIElement[] = [];
    constructor(public liveRendering: boolean) {}

    draw() {
        this.uiElements.forEach((e) => {
            e.draw();
        });
    }

    open() {}
    close() {}

    mouseMoveEvent(event: MouseEvent) {
        for (const elem of this.uiElements) {
            elem.mouseMoveEvent(event);
        }
    }

    mouseUpEvent(event: MouseEvent) {
        for (const elem of this.uiElements) {
            elem.mouseUpEvent(event);
        }
    }

    mouseDownEvent(event: MouseEvent) {
        for (const elem of this.uiElements) {
            elem.mouseDownEvent(event);
        }
    }

    mouseLeaveEvent(event: MouseEvent) {}
}

export class StartScreen extends Screen {
    constructor() {
        super(false);
        this.uiElements.push(
            UIText.new({
                vertical: VerticalAnchorPoint.MIDDLE,
                horizontal: HorizontalAnchorPoint.MIDDLE,
                offset: new Vec2(0, 0),
                size: new Vec2(0, 96),
                text: "Particles",
            }),
        );
        this.uiElements.push(
            UIButton.new({
                vertical: VerticalAnchorPoint.MIDDLE,
                horizontal: HorizontalAnchorPoint.MIDDLE,
                offset: new Vec2(0, 48 + 32),
                size: new Vec2(0, 64),
                text: "Play",
                clickCallback: () => {
                    ScreenManager.setActiveScreen(ScreenManager.GAME_SCREEN);
                },
            }),
        );
    }

    draw() {
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        super.draw();
    }

    open() {
        this.draw();
    }
}

export class EndScreen extends Screen {
    constructor() {
        super(false);
        this.uiElements.push(
            UIText.new({
                vertical: VerticalAnchorPoint.MIDDLE,
                horizontal: HorizontalAnchorPoint.MIDDLE,
                offset: new Vec2(0, 0),
                size: new Vec2(0, 96),
                text: "Game Over",
            }),
        );
        this.uiElements.push(
            UIButton.new({
                vertical: VerticalAnchorPoint.MIDDLE,
                horizontal: HorizontalAnchorPoint.MIDDLE,
                offset: new Vec2(0, 48 + 32),
                size: new Vec2(0, 64),
                text: "Retry",
                clickCallback: () => {
                    ScreenManager.setActiveScreen(ScreenManager.GAME_SCREEN);
                },
            }),
        );
    }

    draw() {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        super.draw();
    }
    open() {
        this.draw();
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
        this.uiElements.push(
            new UIIconButton({
                size: new Vec2(50, 50),
                icon: GameScreen.mgIcon,
                offset: new Vec2(25 + 5, -25),
                horizontal: HorizontalAnchorPoint.LEFT,
                vertical: VerticalAnchorPoint.MIDDLE,
                text: "",
                clickCallback: () => {
                    Game.selTowType = TowerType.MG;
                },
            }),
        );

        this.uiElements.push(
            new UIIconButton({
                size: new Vec2(50, 50),
                icon: GameScreen.sniperIcon,
                offset: new Vec2(25 + 5, 25),
                horizontal: HorizontalAnchorPoint.LEFT,
                vertical: VerticalAnchorPoint.MIDDLE,
                text: "",
                clickCallback: () => {
                    Game.selTowType = TowerType.SNIPER;
                },
            }),
        );
    }

    open() {
        Game.init();
    }

    draw() {
        Game.doFrame();
        super.draw();
    }

    mouseUpEvent(_: MouseEvent): void {
        this.isMouseDown = false;
		this.isMoveDragging = false;
    }

    mouseDownEvent(event: MouseEvent): void {
        super.mouseDownEvent(event);
        this.isMouseDown = true;
        if (!(event as any)[ScreenManager.eventCapturedSymbol]) {
			if (event.button === 0) {
				Game.placeTower()
			}
			else if (event.button === 2) {
                this.isMoveDragging = !Game.checkMouseInteract();
                if (this.isMoveDragging) {
                    this.lastDragX = event.clientX;
                    this.lastDragY = event.clientY;
                }
            }
        }
    }

    mouseMoveEvent(event: MouseEvent): void {
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

    mouseLeaveEvent(event: MouseEvent): void {
        this.isMouseDown = false;
        this.isMoveDragging = false;
    }
}
