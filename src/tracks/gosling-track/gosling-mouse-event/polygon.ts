import { pointsToDegree } from '../../../core/utils/polar';

/**
 * @param point Tuple of the form `[x,y]` to be tested.
 * @param center Tuple of the form `[x,y]` that correspond to the center of an arc.
 * @param radius The inner and outer radius of the arc.
 * @param angle The start and end angle the arc in the range of [0, 360]. Anticlockwise, starting from 12 o'clock.
 * @returns If `true` point lies within the arc, i.e., the slice of the donut.
 */
export const isPointInsideDonutSlice: (
    point: [number, number],
    center: [number, number],
    radius: [number, number],
    angle: [number, number]
) => boolean = ([x, y], [cx, cy], [innerRadius, outerRadius], [startAngle, endAngle]) => {
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    if (dist < innerRadius || outerRadius < dist) {
        // Out of the given radius range
        return false;
    }
    const degree = pointsToDegree(x, y, cx, cy);
    if (degree < startAngle || endAngle < degree) {
        // Out of the given angle range
        return false;
    }
    return true;
};

/**
 * @param point Tuple of the form `[x,y]` to be tested.
 * @param point2 Tuple of the form `[x,y]` to be tested.
 * @param radius A radius of the second point.
 * @returns If `true` point lies within the point.
 */
export const isPointNearPoint: (point: [number, number], point2: number[], radius?: number) => boolean = (
    [x1, y1],
    [x2, y2],
    radius = 5
) => {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) < radius;
};

/**
 * @param range Tuple of the form `[x1,x2]` to be tested.
 * @param point A value x to be tested.
 * @returns If `true` point lies within the point.
 */
export const isPointInsideRange: (range: [number, number], x: number) => boolean = ([x1, x2], x) => {
    return x1 <= x && x <= x2;
};

/**
 * @param range Tuple of the form `[x1,x2]` to be tested.
 * @param x A value x to be tested.
 * @param radius A radius of the point.
 * @returns If `true` point lies within the point.
 */
export const isCircleWithinRange: (range: [number, number], x: number, radius?: number) => boolean = (
    range,
    x,
    radius = 5
) => {
    return isPointInsideRange(range, x - radius) && isPointInsideRange(range, x + radius);
};

/**
 * @param point Tuple of the form `[x1,x2]` to be tested.
 * @param path 1D list of vertices defining the line segments.
 * @return If `true` point lies within the polygon.
 */
export const isAllPointsWithinRange: (range: [number, number], path: number[]) => boolean = (range, path) => {
    return path.filter((_, i) => i % 2 === 0).every(x => isPointInsideRange(range, x));
};

/**
 * From: https://www.geeksforgeeks.org/minimum-distance-from-a-point-to-the-line-segment-using-vectors/
 * @param point Tuple of the form `[x,y]` to be tested.
 * @param path 1D list of vertices defining the line segments.
 * @param dist A threshold distance for test.
 * @return If `true` point lies within the polygon.
 */
export const isPointNearLine: (point: [number, number], path: number[], dist?: number) => boolean = (
    [x, y],
    path,
    dist = 5
) => {
    let x1;
    let y1;
    let x2;
    let y2;
    let isWithin = false;
    for (let i = 0; i < path.length - 2; i += 2) {
        x1 = path[i];
        y1 = path[i + 1];
        x2 = path[i + 2];
        y2 = path[i + 3];

        const AB = [x2 - x1, y2 - y1];
        const BE = [x - x2, y - y2];
        const AE = [x - x1, y - y1];

        // Variables to store dot product
        const AB_BE = AB[0] * BE[0] + AB[1] * BE[1];
        const AB_AE = AB[0] * AE[0] + AB[1] * AE[1];

        let actDist = 0;
        if (AB_BE > 0) {
            actDist = Math.sqrt((y - y2) ** 2 + (x - x2) ** 2);
        } else if (AB_AE < 0) {
            actDist = Math.sqrt((y - y1) ** 2 + (x - x1) ** 2);
        } else {
            actDist = Math.abs(AB[0] * AE[1] - AB[1] * AE[0]) / Math.sqrt(AB[0] ** 2 + AB[1] ** 2);
        }
        if (actDist < dist) {
            isWithin = true;
        }
    }
    return isWithin;
};

/**
 * Adopted from
 * https://github.com/flekschas/utils
 * https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
 * @param point Tuple of the form `[x,y]` to be tested.
 * @param polygon 1D list of vertices defining the polygon.
 * @return If `true` point lies within the polygon.
 */
export const isPointInPolygon: (point: [number, number], polygon: number[]) => boolean = ([x, y], polygon) => {
    let x1;
    let y1;
    let x2;
    let y2;
    let isWithin = false;
    for (let i = 0, j = polygon.length - 2; i < polygon.length; i += 2) {
        x1 = polygon[i];
        y1 = polygon[i + 1];
        x2 = polygon[j];
        y2 = polygon[j + 1];
        if (y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
            isWithin = !isWithin;
        }
        j = i;
    }
    return isWithin;
};
