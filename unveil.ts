//making the game initially fit to the screen

import { ScreenManager } from "./modules/screenManager.js";

//this is updated later
const canvas = window.document.getElementById("canvas") as HTMLCanvasElement;
const clientRect = canvas.getClientRects()[0];
canvas.width = clientRect.width * window.devicePixelRatio;
canvas.height = clientRect.height * window.devicePixelRatio;

//unveiling
window.document.body.style.visibility = "visible";
