/*
 * This code is based on the following repo:
 * https://github.com/higlass/higlass-pileup
 */
import { spawn } from 'threads';
import Worker from './bam-worker.ts?worker&inline';

import type { BamData, Assembly } from '@gosling-lang/gosling-schema';
import type { ModuleThread } from 'threads';
import type { WorkerApi, TilesetInfo, Tiles, Segment, Junction, SegmentWithMate } from './bam-worker';
import { computeChromSizes } from '../../core/utils/assembly';
import type { TabularDataFetcher } from '../utils';
import { uuid } from '../../core/utils/uuid';

const DEBOUNCE_TIME = 200;

type InferTileType<Config extends BamData> = Config['extractJunction'] extends true
    ? Junction
    : Config['loadMates'] extends true
      ? SegmentWithMate
      : Segment;

class BamDataFetcher<Config extends BamData> implements TabularDataFetcher<InferTileType<Config>> {
    static config = { type: 'bam' };
    dataConfig = {}; // required for higlass
    uid: string;
    fetchTimeout?: ReturnType<typeof setTimeout>;
    toFetch: Set<string>;

    MAX_TILE_WIDTH = 2e4 as const;

    private worker: Promise<ModuleThread<WorkerApi>>;

    // This is set by us but is accessed in `fetchTilesDebounced`
    track?: {
        fetching: { delete(id: string): void };
    };

    constructor(config: Config & { assembly: Assembly }) {
        this.uid = uuid();
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

    fetchTilesDebounced(receivedTiles: (tiles: Tiles) => void, tileIds: string[]) {
        const { toFetch } = this;

        const thisZoomLevel = tileIds[0].split('.')[0]; // Example of tileIds: ["3.0", "3.1"]
        const toFetchZoomLevel = toFetch.size ? [...toFetch][0].split('.')[0] : null;

        if (thisZoomLevel !== toFetchZoomLevel) {
            for (const tileId of this.toFetch) {
                this.track?.fetching.delete(tileId);
            }
            this.toFetch.clear();
        }

        tileIds.forEach(x => this.toFetch.add(x));

        if (this.fetchTimeout) {
            clearTimeout(this.fetchTimeout);
        }

        this.fetchTimeout = setTimeout(() => {
            this.sendFetch(receivedTiles, [...this.toFetch]);
            this.toFetch.clear();
        }, DEBOUNCE_TIME);
    }

    async sendFetch(receivedTiles: (tiles: Tiles) => void, tileIds: string[]) {
        (await this.worker).fetchTilesDebounced(this.uid, tileIds).then(receivedTiles);
    }

    async getTabularData(tileIds: string[]): Promise<InferTileType<Config>[]> {
        const buf = await (await this.worker).getTabularData(this.uid, tileIds);
        return JSON.parse(new TextDecoder().decode(buf));
    }
}

export default BamDataFetcher;
