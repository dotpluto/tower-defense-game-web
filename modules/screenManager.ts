"use strict";

import { Screen, StartScreen, GameScreen, EndScreen } from "./screen.js";
import { canvas } from "./graphics.js";
import { get_element } from "./debug.js";
import { Game } from "./game.js";

export class ScreenManager {
    static halveFps: boolean;
    static continueRendering = false;
    static evenFrame = true;
    static lastAnimationFrame: number | null = null;

    static markedForRedraw = false;

    //this symbol is a key for attaching a custom captured state to specific events

    //screens
    static START_SCREEN: Screen;
    static GAME_SCREEN: Screen;
    static END_SCREEN: Screen;

    static activeScreen: Screen | null = null;

    static {
        ScreenManager.START_SCREEN = new StartScreen();
        ScreenManager.GAME_SCREEN = new GameScreen();
        ScreenManager.END_SCREEN = new EndScreen();

        window.addEventListener("resize", (_: UIEvent) => {
            let clientRect = canvas.getClientRects()[0];
            canvas.width = clientRect.width * window.devicePixelRatio;
            canvas.height = clientRect.height * window.devicePixelRatio;
            ScreenManager.activeScreen!.resizeEvent();
            ScreenManager.activeScreen!.draw();
        });


        //input forwarding to active screen
        window.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        canvas.addEventListener("mouseleave", (event) => {
            ScreenManager.activeScreen?.mouseLeaveEvent(event);
        });

        canvas.addEventListener("mousemove", (event) => {
            ScreenManager.activeScreen?.mouseMoveEvent(event);
            ScreenManager.redrawIfShould();
        });

        canvas.addEventListener("mouseup", (event) => {
            this.activeScreen?.mouseUpEvent(event);
            ScreenManager.redrawIfShould();
        });

        canvas.addEventListener("mousedown", (mouseEvent) => {
            const cme = CapturableMouseEvent.makeFrom(mouseEvent);
            this.activeScreen?.mouseDownEvent(cme);
            ScreenManager.redrawIfShould();
        });
    }

    static setActiveScreen(new_screen: Screen) {
        this.activeScreen?.close();
        //cancelling old animation frame
        if (ScreenManager.lastAnimationFrame !== null) {
            window.cancelAnimationFrame(ScreenManager.lastAnimationFrame);
        }

        ScreenManager.activeScreen = new_screen;
        new_screen.resizeEvent();
        new_screen.open();

        ScreenManager.continueRendering = new_screen.liveRendering;
        if (new_screen.liveRendering === true) {
            ScreenManager.lastAnimationFrame = window.requestAnimationFrame(
                ScreenManager.renderLoop,
            );
        }
    }


    static renderLoop() {
        ScreenManager.evenFrame = !ScreenManager.evenFrame;
        if (!ScreenManager.evenFrame) {
            ScreenManager.activeScreen?.draw();
        }

        if (ScreenManager.continueRendering)
            ScreenManager.lastAnimationFrame = window.requestAnimationFrame(
                ScreenManager.renderLoop,
            );
    }

    //a window can request a redraw by calling the mark for redraw function
    static markForRedraw() {
        if (!ScreenManager.continueRendering) {
            ScreenManager.markedForRedraw = true;
        }
    }

    static redrawIfShould() {
        if (ScreenManager.markedForRedraw) {
            ScreenManager.activeScreen!.draw();
            ScreenManager.markedForRedraw = false;
        }
    }
}

/** This belongs to the CapturableMouseEvent class below. */
const wasCapturedSymbol = Symbol("CapturableMouseEvent.wasCapturedSymbol");

/**
  * This is a wrapper for a MouseEvent that provides it with a extra wasCaptured
  * flag while making sure not to hide any functionality.
 */
export class CapturableMouseEvent extends MouseEvent {
    private [wasCapturedSymbol]: boolean = false;
    static makeFrom(me: MouseEvent): CapturableMouseEvent {
        const cme = me as CapturableMouseEvent;
        cme[wasCapturedSymbol] = false;
        return cme as CapturableMouseEvent;
    }

    static checkCaptured(cme: CapturableMouseEvent): boolean {
        return cme[wasCapturedSymbol];
    }

    static capture(cme: CapturableMouseEvent) {
        cme[wasCapturedSymbol] = true;
    }
}
