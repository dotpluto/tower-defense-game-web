import { Resources } from "./currency";
import { Game } from "./game";

export class LoggableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }

    log() {
        console.error(this.name);
    }
}

export class AssertionFailedError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
    }
}

export class TypeAssertionFailedError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
    }
}

export class InstanceAssertionFailedError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
    }
}

export class CalledVirtualFunctionError extends Error {
    constructor() {
        super();
        this.name = this.constructor.name;
    }
}

export function assert(value: boolean) {
    if (value !== true) throw new AssertionFailedError();
}

export function typeAssert(value: any, type: string) {
    if (typeof value !== type) throw new TypeAssertionFailedError();
}

export function instanceAssert(value: any, type: Function) {
    if (!(value instanceof type)) throw new InstanceAssertionFailedError();
}

export function passlog<T>(message: string, value: T): T {
	console.log(message, value);
	return value;
}

export function get_element<T>(element_id: string, element_type: new () => T): T {
    let element = document.getElementById(element_id);
    if(element === null) {
	throw Error(`Tried to get the element with the id ${element_id} but found nothing.`);
    }
    if(!(element instanceof element_type)) {
	throw Error(`Got element with id ${element_id} but it was not of the expected type`);
    }
    return element;
}

export interface ExtendedWindow extends Window {
    debug_tools: {
	disable_death: boolean,
	free_build: boolean,
    },
}

export function cast_window(window: Window) : ExtendedWindow {
    return (window as ExtendedWindow);
}

cast_window(window).debug_tools = {
    disable_death: false,
    free_build: false,
};
