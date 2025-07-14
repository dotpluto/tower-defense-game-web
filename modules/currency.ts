export class CurrencyManager {
	public owned: Resources;
	public income: Resources;

    constructor(energy: number, ore: number) {
		this.owned = new Resources(energy, ore);
		this.income = new Resources(0, 0);
    }

    update() {
	this.owned.add(this.income);
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
