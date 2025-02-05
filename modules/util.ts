/* Deletes the element in an UNSORTED collection.
 * Assumes one or more elements.
*/
export function fastDelete(deleteInd: number, array: any[]): void {
	const lastInd = array.length - 1;
	array[deleteInd] = array[lastInd];
	array.pop();
}
/**
 * A extension of the vanilla array that hopes to be a little more efficient.
 */
export class EffArray<T> extends Array<T> {
	/**
	 * Deleting at specified index of this array. This doesn't preserve the array order.
	 */
	unorderedDelete(delInd: number) {
		const lastInd = this.length - 1;
		this[delInd] = this[lastInd];
		this.pop();
	}

	/**
	  * Clearing this array a bit more efficient.
	  */
	clear() {
		for(let i = this.length; i > 0; i--) {
			this.pop();
		}
	}
}
