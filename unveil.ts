//making the game initially fit to the screen

import { ScreenManager } from "./modules/screenManager.js";

//this is updated later
const canvas = window.document.getElementById("canvas") as HTMLCanvasElement;
const clientRect = canvas.getClientRects()[0];
canvas.width = clientRect.width;
canvas.height = clientRect.height;

//unveiling
window.document.body.style.visibility = "visible";
