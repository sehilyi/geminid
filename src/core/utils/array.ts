/**
 * Repeat elements in the array until its size becomes to `targetLength`.
 */
export function arrayRepeat<T>(base: T[], targetLength: number): T[] {
    if (base.length === targetLength) return base;
    else if (base.length > targetLength) return base.slice(0, targetLength);
    else {
        const repeated = Array.from(base);
        do {
            repeated.push(...Array.from(base));
        } while (repeated.length < targetLength);
        return repeated.slice(0, targetLength);
    }
}

/**
 * Insert item to an array and return it.
 * @prop {array} array Array to be updated.
 * @prop {number} index Index of array to insert new item.
 * @prop {any} item Item to be inserted.
 * @returns Updated array.
 */
export function insertItemToArray<T>(array: T[], index: number, item: T): T[] {
    return [...array.slice(0, index), item, ...array.slice(index)];
}

/**
 * Insert item to an array and return it.
 * @prop {array} array Array to be updated.
 * @prop {number} index Index of array to change item.
 * @prop {any} item Item to be inserted.
 * @returns Updated array.
 */
export function modifyItemInArray<T>(array: T[], index: number, item: T): T[] {
    return [...array.slice(0, index), item, ...array.slice(index + 1)];
}

/**
 * Remove item from an array stored in a certain index.
 * @prop {array} array Array to be updated.
 * @prop {number} index Index of an item to be removed.
 * @returns Updated array.
 */
export function removeItemFromArray<T>(array: T[], index: number): T[] {
    return [...array.slice(0, index), ...array.slice(index + 1)];
}

/**
 * Convert 1D array into 2D array where each pair of elements are grouped.
 * @prop {array} array Array to be used.
 * @returns Updated array.
 */
export function flatArrayToPairArray<T>(array: T[]): [T, T][] {
    const output: [T, T][] = [];
    for (let i = 0; i < array.length; i += 2) {
        output.push([array[i], array[i + 1]]);
    }
    return output;
}
