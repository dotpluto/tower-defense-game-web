export class Currency {
	public resourc: Resources;
	public curProvs: Set<ICurrencyProvider> = new Set();

    constructor(resourc: IResources) {
		this.resourc = new Resources(resourc);
    }

    update() {
		for(const curProvi of this.curProvs) {
			this.resourc.add(curProvi.getProv());
		}
    }

    addCurProv(curProv: ICurrencyProvider) {
		this.curProvs.add(curProv);
	}

	remCurProv(curProv: ICurrencyProvider) {
		this.curProvs.delete(curProv);
	}
}

export interface IResources {
    energy?: number;
    nilrun?: number;
    zasterite?: number;
    puritanium?: number;
    vitrium?: number;
    charite?: number;
}

/**
 * A reusable container for anything to do with resources.
 */
export class Resources implements IResources {
    energy: number;
    nilrun: number;
    zasterite: number;
    puritanium: number;
    vitrium: number;
    charite: number;

    constructor(args: IResources) {
        this.energy = args.energy || 0;
        this.nilrun = args.nilrun || 0;
        this.zasterite = args.zasterite || 0;
        this.puritanium = args.puritanium || 0;
        this.vitrium = args.vitrium || 0;
        this.charite = args.charite || 0;
    }

    satisfies(toBeSatisfied: Resources) {
        return (
            toBeSatisfied.energy <= this.energy &&
            toBeSatisfied.nilrun <= this.nilrun &&
            toBeSatisfied.zasterite <= this.zasterite &&
            toBeSatisfied.vitrium <= this.vitrium &&
            toBeSatisfied.charite <= this.charite
        );
    }

    remove(tR: Resources) {
        this.energy -= tR.energy;
        this.nilrun -= tR.nilrun;
        this.zasterite -= tR.zasterite;
        this.puritanium -= tR.puritanium;
        this.vitrium -= tR.vitrium;
        this.charite -= tR.charite;
    }

    add(tR: Resources) {
        this.energy += tR.energy;
        this.nilrun += tR.nilrun;
        this.zasterite += tR.zasterite;
        this.puritanium += tR.puritanium;
        this.vitrium += tR.vitrium;
        this.charite += tR.charite;
    }
}

export interface ICurrencyProvider {
	getProv: () => Resources,
}
