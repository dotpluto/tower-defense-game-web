import {
    IUIParent,
    Anchor,
    getAnchorOffsetHelper,
    VerticalAnchor,
    HorizontalAnchor,
    UIButton,
    UIScore,
    UIText,
} from "./uiElement.js";
import { Vec2 } from "./vector2.js";
import { CapturableMouseEvent, ScreenManager } from "./screenManager.js";
import { Game } from "./game.js";
import { loadTexture } from "./assetManagement.js";
import { TowerType } from "./tower.js";
import { canvas, view } from "./graphics.js"
import { get_element } from "./debug.js";

export abstract class Screen extends IUIParent {
    public ui_div: HTMLDivElement;

    constructor(public liveRendering: boolean, ui_div_id: string) {
        super();
	let ui_div = document.getElementById(ui_div_id);
	if(ui_div === null) {
	    throw Error(`Didn't find any ui div with id ${ui_div_id}.`);
	} else if(!(ui_div instanceof HTMLDivElement)) {
	    throw Error(`The element with id ${ui_div_id} is not a div.`);
	}
	this.ui_div = ui_div;
    }

    register_click_handler(button_id: string, onclick: () => void) {
	get_element(button_id, HTMLButtonElement).onclick = onclick;
    }

    draw() {
        this.children.forEach((e) => {
            e.draw();
        });
    }

    open() {
	this.ui_div.style.visibility = "visible";
    }

    close() {
	this.ui_div.style.visibility = "hidden";
    }

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

    mouseLeaveEvent(_event: MouseEvent) {
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
        super(false, "startScreen");
	this.register_click_handler("playButton", () => {
	    ScreenManager.setActiveScreen(ScreenManager.GAME_SCREEN);
	})
    }

    draw() {
	view.clear("Black");
        super.draw();
    }

    open() {
	super.open();
        this.draw();
    }
}

export class EndScreen extends Screen {
    constructor() {
        super(false, "endScreen");
	this.register_click_handler("playAgainButton", () => {
	    ScreenManager.setActiveScreen(ScreenManager.START_SCREEN)
	})
    }

    draw() {
	view.clear("Black");
        super.draw();
    }
    open() {
	super.open();
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
        super(true, "gameScreen");
        Game.screen = this;

	this.register_click_handler("upgradeReactorButton", () => {
	    if(Game.level!.currency.owned.nilrun >= 10) {
		Game.level!.currency.income.energy += 0.001;
		Game.level!.currency.owned.nilrun -= 10;
	    }
	})

	this.register_click_handler("mgButton", () => {
	    Game.selBuildingType = TowerType.MG;
	})
	this.register_click_handler("rocketButton", () => {
	    Game.selBuildingType = TowerType.ROCKET;
	})
	this.register_click_handler("sniperButton", () => {
	    Game.selBuildingType = TowerType.SNIPER;
	})
    }

    open() {
	super.open();
        Game.init();
        Game.doFrame();
    }

    draw() {
        Game.doFrame();
        super.draw();
	if(Game.screenToChangeTo !== null) {
	    ScreenManager.setActiveScreen(Game.screenToChangeTo)
	    Game.screenToChangeTo = null;
	}
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
