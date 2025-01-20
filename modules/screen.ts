import {
    UIText,
    HAnchPoint,
    VAnchPoint,
    UIButton,
    UIElement,
    UIIconButton,
    addChild,
    IUIParent,
    UIScore,
} from "modules/uiElement.js";
import { Vec2 } from "modules/vector2.js";
import { CapturableMouseEvent, ScreenManager } from "modules/screenManager.js";
import { Game } from "modules/game.js";
import { canvas, ctx } from "modules/graphics.js";
import { loadTexture } from "modules/assetManagement.js";
import { BuildingType, TowerType } from "modules/entity.js";

export abstract class Screen implements IUIParent {
    uiElements: UIElement[] = [];
    children: UIElement[] = [];
    constructor(public liveRendering: boolean) {}

    draw() {
        this.uiElements.forEach((e) => {
            e.draw();
        });
    }

    open() {}
    close() {}

    //event passdowns
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

    mouseDownEvent(event: CapturableMouseEvent) {
        for (const elem of this.uiElements) {
            elem.mouseDownEvent(event);
        }
    }

    mouseLeaveEvent(event: MouseEvent) {
	}

	resizeEvent() {
		for (const elem of this.children) {
			elem.computePos();
		}
	}

}

export class StartScreen extends Screen {
    constructor() {
        super(false);
        const particlesText = addChild(this, (parent) => {
            return UIText.new({
                parent: parent, //display
                parHorAnch: HAnchPoint.MIDDLE,
                parVerAnch: VAnchPoint.MIDDLE,
                horAnch: HAnchPoint.MIDDLE,
                verAnch: VAnchPoint.MIDDLE,
                offset: new Vec2(0, 0),
                size: new Vec2(300, 96),
                text: "Particles",
				resizeForTxt: true,
            });
        });
        this.uiElements.push(particlesText);

        const playButton = addChild(particlesText, (parent) => {
            return UIButton.new({
                parent: parent,
                parHorAnch: HAnchPoint.MIDDLE,
                parVerAnch: VAnchPoint.BOTTOM,
                horAnch: HAnchPoint.MIDDLE,
                verAnch: VAnchPoint.TOP,
                text: "Play",
				resizeForTxt: true,
                offset: new Vec2(0, 0),
                size: new Vec2(100, 64),
                clickCallback: () => {
                    ScreenManager.setActiveScreen(ScreenManager.GAME_SCREEN);
                },
            })
        });
		this.uiElements.push(playButton);
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
        /*
        this.uiElements.push(
            UIText.new({
                vertical: VAnchPoint.MIDDLE,
                horizontal: HAnchPoint.MIDDLE,
                offset: new Vec2(0, 0),
                size: new Vec2(0, 96),
                text: "Game Over",
            }),
        );
        this.uiElements.push(
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

		const firstButton = addChild(this, (parent) => {
			return new UIIconButton({
				parent: parent,
				parHorAnch: HAnchPoint.LEFT,
				parVerAnch: VAnchPoint.MIDDLE,
                horAnch: HAnchPoint.LEFT,
                verAnch: VAnchPoint.MIDDLE,
				text: "",
				resizeForTxt: false,
				offset: new Vec2(0, 0),
				icon: GameScreen.mgIcon,
				size: new Vec2(50, 50),
                clickCallback: () => {
                    Game.selBuildingType = TowerType.MG;
                },
			});
		});
		this.uiElements.push(firstButton);

		const secondButton = addChild(firstButton, (parent) => {
			return new UIIconButton({
				parent: parent,
				parHorAnch: HAnchPoint.MIDDLE,
				parVerAnch: VAnchPoint.BOTTOM,
                horAnch: HAnchPoint.MIDDLE,
                verAnch: VAnchPoint.TOP,
				text: "",
				resizeForTxt: false,
				offset: new Vec2(0, 0),
				icon: GameScreen.sniperIcon,
				size: new Vec2(50, 50),
                clickCallback: () => {
                    Game.selBuildingType = TowerType.SNIPER;
                },
			});
		});
		this.uiElements.push(secondButton);

		const thirdButton = addChild(secondButton, (parent) => {
			return new UIIconButton({
				parent: parent,
				parHorAnch: HAnchPoint.MIDDLE,
				parVerAnch: VAnchPoint.BOTTOM,
                horAnch: HAnchPoint.MIDDLE,
                verAnch: VAnchPoint.TOP,
				text: "",
				resizeForTxt: false,
				offset: new Vec2(0, 0),
				icon: BuildingType.SOLAR_TEXT,
				size: new Vec2(50, 50),
                clickCallback: () => {
                    Game.selBuildingType = BuildingType.SOLAR;
                },
			});
		});
		this.uiElements.push(thirdButton);

		const score = addChild(this, (parent) => {
			return new UIScore({
				parent: parent,
				parHorAnch: HAnchPoint.MIDDLE,
				parVerAnch: VAnchPoint.TOP,
                horAnch: HAnchPoint.MIDDLE,
                verAnch: VAnchPoint.TOP,
				text: "",
				resizeForTxt: false,
				offset: new Vec2(0, 0),
				size: new Vec2(50, 50),
				getScore() {
				    return Game.level!.money.toString();
				},
			});
		});
		this.uiElements.push(score);
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

    mouseDownEvent(event: CapturableMouseEvent): void {
        super.mouseDownEvent(event);
        this.isMouseDown = true;
        if (!CapturableMouseEvent.checkCaptured(event)) {
            if (event.button === 0) {
                Game.placeTower();
            } else if (event.button === 2) {
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
