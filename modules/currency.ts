import { get_element } from "./debug.js";

export class CurrencyManager {
	public owned: Resources;
	public income: Resources;
	public energy_span: HTMLSpanElement;
	public ore_span: HTMLSpanElement;

    constructor(energy: number, ore: number) {
		this.owned = new Resources(energy, ore);
		this.income = new Resources(0, 0);
		this.energy_span = get_element("energySpan", HTMLSpanElement);
		this.ore_span = get_element("oreSpan", HTMLSpanElement);
    }

    update() {
	this.owned.add(this.income);
    }

    update_graphics() {
	let rounded_energy = Math.floor(this.owned.energy * 10) / 10;
	let rounded_ore = Math.floor(this.owned.nilrun * 10) / 10;
	this.energy_span.innerHTML = rounded_energy.toString()
	this.ore_span.innerHTML = rounded_ore.toString()
    }
}

/**
 * A reusable container for anything to do with resources.
 */
export class Resources {
    energy: number;
    nilrun: number;
    //zasterite: number;
    //puritanium: number;
    //vitrium: number;
    //charite: number;

    constructor(energy: number, ore: number) {
        this.energy = energy;
        this.nilrun = ore;
        //this.zasterite = args.zasterite || 0;
        //this.puritanium = args.puritanium || 0;
        //this.vitrium = args.vitrium || 0;
        //this.charite = args.charite || 0;
    }

    satisfies(toBeSatisfied: Resources) {
        return (
            toBeSatisfied.energy <= this.energy &&
            toBeSatisfied.nilrun <= this.nilrun
            // && toBeSatisfied.zasterite <= this.zasterite &&
            // toBeSatisfied.puritanium <= this.puritanium &&
            // toBeSatisfied.vitrium <= this.vitrium &&
            // toBeSatisfied.charite <= this.charite
        );
    }

    remove(tR: Resources) {
        this.energy -= tR.energy;
        this.nilrun -= tR.nilrun;
        // this.zasterite -= tR.zasterite;
        // this.puritanium -= tR.puritanium;
        // this.vitrium -= tR.vitrium;
        // this.charite -= tR.charite;
    }

    add(tR: Resources) {
        this.energy += tR.energy;
        this.nilrun += tR.nilrun;
        // this.zasterite += tR.zasterite;
        // this.puritanium += tR.puritanium;
        // this.vitrium += tR.vitrium;
        // this.charite += tR.charite;
    }
}
