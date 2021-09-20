import type {
    GenericFilehandle,
    FilehandleOptions,
    Stats,
    Fetcher,
    PolyfilledResponse
} from 'generic-filehandle/dist/filehandle';

const myGlobal = typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : { fetch: undefined };

export class RemoteFile implements GenericFilehandle {
    private url: string;
    private _stat?: Stats;
    private fetchImplementation: Fetcher;
    private baseOverrides: any = {};

    private async getBufferFromResponse(response: PolyfilledResponse): Promise<Buffer> {
        if (typeof response.buffer === 'function') {
            return response.buffer();
        } else if (typeof response.arrayBuffer === 'function') {
            const resp = await response.arrayBuffer();
            return Buffer.from(resp);
        } else {
            throw new TypeError('invalid HTTP response object, has no buffer method, and no arrayBuffer method');
        }
    }

    public constructor(source: string, opts: FilehandleOptions = {}) {
        this.url = source;
        const fetch = opts.fetch || (myGlobal.fetch && myGlobal.fetch.bind(myGlobal));
        if (!fetch) {
            throw new TypeError(`no fetch function supplied, and none found in global environment`);
        }
        if (opts.overrides) {
            this.baseOverrides = opts.overrides;
        }
        this.fetchImplementation = fetch;
    }

    public async fetch(input: RequestInfo, init: RequestInit | undefined): Promise<PolyfilledResponse> {
        let response;
        try {
            response = await this.fetchImplementation(input, init);
        } catch (e) {
            if ((e as Error).message === 'Failed to fetch') {
                // refetch to to help work around a chrome bug (discussed in generic-filehandle issue #72) in
                // which the chrome cache returns a CORS error for content in its cache.
                // see also https://github.com/GMOD/jbrowse-components/pull/1511
                console.warn(
                    `generic-filehandle: refetching ${input} to attempt to work around chrome CORS header caching bug`
                );
                response = await this.fetchImplementation(input, { ...init, cache: 'reload' });
            } else {
                throw e;
            }
        }
        return response;
    }

    public async read(
        buffer: Buffer,
        offset = 0,
        length: number,
        position = 0,
        opts: FilehandleOptions = {}
    ): Promise<{ bytesRead: number; buffer: Buffer }> {
        const { headers = {}, signal, overrides = {} } = opts;
        if (length < Infinity) {
            headers.range = `bytes=${position}-${position + length}`;
        } else if (length === Infinity && position !== 0) {
            headers.range = `bytes=${position}-`;
        }
        const args = {
            ...this.baseOverrides,
            ...overrides,
            headers: { ...headers, ...overrides.headers, ...this.baseOverrides.headers },
            method: 'GET',
            redirect: 'follow',
            mode: 'cors',
            signal
        };
        const response = await this.fetch(this.url, args);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        if ((response.status === 200 && position === 0) || response.status === 206) {
            const responseData = await this.getBufferFromResponse(response);
            const bytesCopied = responseData.copy(buffer, offset, 0, Math.min(length, responseData.length));

            // try to parse out the size of the remote file
            const res = response.headers.get('content-range');
            const sizeMatch = /\/(\d+)$/.exec(res || '');
            if (sizeMatch && sizeMatch[1]) {
                this._stat = { size: parseInt(sizeMatch[1], 10) };
            }

            return { bytesRead: bytesCopied, buffer };
        }

        if (response.status === 200) {
            throw new Error('${this.url} fetch returned status 200, expected 206');
        }

        // TODO: try harder here to gather more information about what the problem is
        throw new Error(`HTTP ${response.status} fetching ${this.url}`);
    }

    public async readFile(options: FilehandleOptions | string = {}): Promise<Buffer | string> {
        let encoding;
        let opts;
        if (typeof options === 'string') {
            encoding = options;
            opts = {};
        } else {
            encoding = options.encoding;
            opts = options;
            delete opts.encoding;
        }
        const { headers = {}, signal, overrides = {} } = opts;
        const args = {
            headers,
            method: 'GET',
            redirect: 'follow',
            mode: 'cors',
            signal,
            ...this.baseOverrides,
            ...overrides
        };
        const response = await this.fetch(this.url, args);

        if (!response) {
            throw new Error('generic-filehandle failed to fetch');
        }

        if (response.status !== 200) {
            throw Object.assign(new Error(`HTTP ${response.status} fetching ${this.url}`), {
                status: response.status
            });
        }
        if (encoding === 'utf8') {
            return response.text();
        }
        if (encoding) {
            throw new Error(`unsupported encoding: ${encoding}`);
        }
        return this.getBufferFromResponse(response);
    }

    public async stat(): Promise<Stats> {
        if (!this._stat) {
            const buf = Buffer.allocUnsafe(10);
            await this.read(buf, 0, 10, 0);
            if (!this._stat) {
                throw new Error(`unable to determine size of file at ${this.url}`);
            }
        }
        return this._stat;
    }

    public async close(): Promise<void> {
        return;
    }
}

export const LocalFile = {};
