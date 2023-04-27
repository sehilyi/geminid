/*
 * This document is heavily based on the following repo by @alexander-veit:
 * https://github.com/dbmi-bgm/higlass-sv/blob/main/src/sv-fetcher.js
 */
import { spawn } from 'threads';
import Worker from './bed-worker.ts?worker&inline';

import { computeChromSizes } from '../../core/utils/assembly';

import type { ModuleThread } from 'threads';
import type { Assembly, BedData } from '../../core/gosling.schema';
import type { WorkerApi, TilesetInfo, EmptyTile, BedTile } from './bed-worker';
import type { TabularDataFetcher } from '../utils';

const DEBOUNCE_TIME = 200;

export type BedDataConfig = BedData & { assembly: Assembly };

class BedDataFetcher implements TabularDataFetcher<BedTile> {
    static config = { type: 'bed' };
    dataConfig = {}; // required for higlass
    uid: string;
    prevRequestTime: number;
    track?: any;

    private toFetch: Set<string>;
    private fetchTimeout?: ReturnType<typeof setTimeout>;
    private worker: Promise<ModuleThread<WorkerApi>>;

    constructor(HGC: import('@higlass/types').HGC, config: BedDataConfig) {
        this.uid = HGC.libraries.slugid.nice();
        this.prevRequestTime = 0;
        this.toFetch = new Set();
        const { url, indexUrl, assembly, ...options } = config;
        this.worker = spawn<WorkerApi>(new Worker()).then(async worker => {
            const chromSizes = Object.entries(computeChromSizes(assembly).size);
            await worker.init(this.uid, { url, indexUrl }, chromSizes, options);
            return worker;
        });
    }

    /*
     * Collect Tileset Information, such as tile size and genomic positions
     */
    async tilesetInfo(callback: (info: TilesetInfo) => void) {
        (await this.worker).tilesetInfo(this.uid).then(callback);
    }

    fetchTilesDebounced(receivedTiles: (tiles: Record<string, EmptyTile>) => void, tileIds: string[]) {
        this.track.drawLoadingCue();

        tileIds.forEach(tileId => this.toFetch.add(tileId));

        if (this.fetchTimeout) {
            clearTimeout(this.fetchTimeout);
        }

        this.fetchTimeout = setTimeout(() => {
            this.sendFetch(receivedTiles, [...this.toFetch]);
            this.toFetch.clear();
        }, DEBOUNCE_TIME);
    }

    async sendFetch(receivedTiles: (tiles: Record<string, EmptyTile>) => void, tileIds: string[]) {
        (await this.worker).fetchTilesDebounced(this.uid, tileIds).then(receivedTiles);
    }

    async getTabularData(tileIds: string[]): Promise<BedTile[]> {
        const buf = await (await this.worker).getTabularData(this.uid, tileIds);
        const parsed = JSON.parse(new TextDecoder().decode(buf));
        console.warn(parsed);
        return parsed;
    }
}

export default BedDataFetcher;
