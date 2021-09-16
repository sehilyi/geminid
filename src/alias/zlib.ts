// For GMOD/bbi-js
// ref: https://github.com/GMOD/bbi-js/blob/891dbf9a422cb680f2b88ba605f30c9c5ad90dfa/src/blockView.ts#L387
import { Buffer } from 'buffer';
import { unzlibSync } from 'fflate';
const zlib = {
    inflateSync: (src: Uint8Array) => Buffer.from(unzlibSync(src)),
    gunzip: () => {
        throw Error('zlib.gunzip not Implemented.');
    }
};
export default zlib;
