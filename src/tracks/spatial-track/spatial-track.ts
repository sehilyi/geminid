import type { ChannelValue, Color, OverlaidTrack, SingleTrack, Size } from "@gosling-lang/gosling-schema";
import * as chs from "chromospace";
import type { CsvDataFetcherClass, LoadedTiles } from "src/data-fetchers/csv/csv-data-fetcher";
import { tableFromArrays, tableFromIPC, tableToIPC } from "@uwdata/flechette";

export type SpatialTrackOptions = {
    spec: SingleTrack | OverlaidTrack;
    color: string | undefined;
    test: string | undefined;
    data3D: string | undefined;
    spatial: { //~ spatial encoding
        x: string;
        y: string;
        z: string;
    };
};

const ERROR_COLOR = "#ff00ff";

function transformObjectToArrow(t: LoadedTiles, options: SpatialTrackOptions): Uint8Array | null {
    const tabularData = t['0.0'].tabularData; //~ TODO: tile id
    const xArr: number[] = [];
    const yArr: number[] = [];
    const zArr: number[] = [];
    const chrArr: string[] = [];
    const coordArr: number[] = [];

    const parseAsNumber = (e: string | number): number => {
        if (typeof e === 'string') {
            return parseFloat(e);
        }
        return e;
    }
    console.log(options);

    const fieldForSpatialX = options.spec.spatial.x;
    const fieldForSpatialY = options.spec.spatial.y;
    const fieldForSpatialZ = options.spec.spatial.z;
    const fieldForSpatialChr = options.spec.spatial.chr;
    const fieldForSpatialCoord = options.spec.spatial.coord;
    console.log(`fieldForSpatialX: ${fieldForSpatialX},\nfieldForSpatialY: ${fieldForSpatialY},\nfieldForSpatialZ: ${fieldForSpatialZ}`);
    console.log(`fieldForSpatialChr : ${fieldForSpatialChr},\nfieldForSpatialCoord: ${fieldForSpatialCoord}`);

    for (let i = 0; i < tabularData.length; i++) {
        // same as `xArr.push(parseAsNumber(tabularData[i].x));` but here I can use the string from the `"x": { "field": "whatever-value" }` instead of hard-coded ".x"
        xArr.push(parseAsNumber(tabularData[i][fieldForSpatialX]));
        yArr.push(parseAsNumber(tabularData[i][fieldForSpatialY]));
        zArr.push(parseAsNumber(tabularData[i][fieldForSpatialZ]));
        chrArr.push(tabularData[i][fieldForSpatialChr] as string);
        coordArr.push(parseAsNumber(tabularData[i][fieldForSpatialCoord]));
    }
    const arrays = {
        x: xArr,
        y: yArr,
        z: zArr,
        chr: chrArr,
        coord: coordArr,
    };
    const table = tableFromArrays(arrays);
    const buffer = tableToIPC(table, { format: "file" });
    return buffer;
}

function fetchValuesFromColumn(columnName: string, arrowIpc: Uint8Array): number[] | string[] {
    const table = tableFromIPC(arrowIpc);
    const column = table.getChild(columnName).toArray();
    return column;
}

function findMinAndMaxOfColumn(column: Int16Array): [number, number] {
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const v of column) {
        minVal = Math.min(minVal, v);
        maxVal = Math.max(maxVal, v);
    }
    return [minVal, maxVal];
}

//~ TODO: make more generic
function getRange(size: Size): [number, number] {
    if (size.range) {
        //~ TODO: yeah...this is ugly
        return [size.range[0] as number, size.range[1] as number];
    } else {
        return [0.01, 0.001];
    }
}

/**
 * Just a utility function...should be removed
 */
const randomColors = (n: number) => {
    const colors = [];
    for (let j = 0; j < n; j++) {
        let colorStr = "#";
        for (let i = 0; i < 6; i++) {
            const maxNum = 16; //~ maximum numerical value: 0 - 16 (F)
            const randNum = Math.floor(Math.random() * maxNum);
            colorStr += randNum.toString(16); //~ 16 is base
        }
        colors.push(colorStr);
    }
    return colors;
}

/**
 * Returns something we can feed to chromospace view config
 */
function handleColorField(color?: ChannelValue | Color | string, arrowIpc: Uint8Array): string {
    if (color === undefined) {
        return "red";
    } else if (typeof color === 'string') {
        return color;
    } else if ("value" in color) {
        return color.value as string;
    } else if ("field" in color) {
        if (!color.type) {
            color.type = 'nominal'; // assume 'nominal' by default?
        }
        if (color.type === 'nominal') {
            console.warn("not implemented!");
            const values = fetchValuesFromColumn(color.field, arrowIpc) as string[]; //~TODO: forcing to string[] not good
            const colScale = randomColors(50); //~ just some big number
            const colorConfig = {
                values: [...values],
                //min: minVal,
                //max: maxVal,
                colorScale: colScale,
            };
            return colorConfig;
            return ERROR_COLOR;
        } else if (color.type === 'quantitative') {
            const values = fetchValuesFromColumn(color.field, arrowIpc);
            console.log("values", values);
            const [minVal, maxVal] = findMinAndMaxOfColumn(values);
            console.log(`minVal = ${minVal}, maxVal = ${maxVal}`);
            const colorConfig = {
                //values: values,
                values: [...values],
                min: minVal,
                max: maxVal,
                //colorScale: "viridis",
                colorScale: "greens",
            };
            return colorConfig;
        }
        else {
            return ERROR_COLOR;
        }
    } else {
        return ERROR_COLOR; // error color
    }
}

//~ I see a case for a generic impl for color and size...
function handleSizeField(size?: ChannelValue | Size | number, arrowIpc: Uint8Array): number {
    if (size === undefined) {
        return 0.01;
    } else if (typeof size === 'number') {
        return size;
    } else if ("value" in size) {
        return size.value as number;
    } else if ("field" in size) {
        if (!size.type) {
            size.type = 'quantitative'; // assume 'nominal' by default?
        }
        if (size.type === 'nominal') {
            console.warn("not implemented!");
        } else if (size.type === 'quantitative') {
            const values = fetchValuesFromColumn(size.field, arrowIpc);
            const [rangeMin, rangeMax] = getRange(size);
            console.log(`size.field = ${size.field}`);
            console.log(values);
            const [minVal, maxVal] = findMinAndMaxOfColumn(values);
            const sizeConfig = {
                values: [...values],
                min: minVal,
                max: maxVal,
                scaleMin: rangeMin,
                scaleMax: rangeMax,
            };
            return sizeConfig;
        }
        else {
            return 0.01;
        }
    } else {
        return 0.01;
    }
}

export function createSpatialTrack(options: SpatialTrackOptions, dataFetcher: CsvDataFetcherClass, container: HTMLDivElement) {
    console.log(`MARK was: ${options.spec.mark}`);
    console.log("SPEC OPTIONS");
    console.log(options);
    options.spec.size
    console.warn(`options.test: ${options.test}`);
    dataFetcher.tilesetInfo((info) => {
        console.log("info");
        console.log(info);
        console.log("dataConfig");
        console.log(dataFetcher.dataConfig);
    });
    dataFetcher.fetchTilesDebounced((t) => {
        console.log('CSV tiles: ~~~~~~~~');
        console.log(t);
        const ipcBuffer = transformObjectToArrow(t, options);
        if (ipcBuffer) {

            let chromatinScene = chs.initScene();
            const arrowIpc = ipcBuffer.buffer;
            const color = handleColorField(options.spec.color, arrowIpc);
            const scale = handleSizeField(options.spec.size, arrowIpc);
            console.log("scale config", scale);
            const viewConfig = {
                scale: scale,
                color: color,
                mark: options.spec.mark,
            };
            console.log("viewConfig", viewConfig);
            const s = chs.load(ipcBuffer.buffer, { center: true, normalize: true });

            const result = s;

            const isModel = "parts" in result; //~ ChromatinModel has .parts
            console.log(`isModel: ${isModel}`);
            if (isModel) {
                chromatinScene = chs.addModelToScene(chromatinScene, result, viewConfig);
            } else {
                chromatinScene = chs.addChunkToScene(chromatinScene, result, viewConfig);
            }
            const [_, canvas] = chs.display(chromatinScene, { alwaysRedraw: false });

            container.appendChild(canvas);
        } else {
        }

    }, ["0.0", "1.0"]);
}
