export function validTilesetUrl(url: string) {
    if (!url.includes('tileset_info/?d=') || (!url.includes('https:') && !url.includes('http:'))) {
        return false;
    }
    return true;
}

export function parseServerAndTilesetUidFromUrl(url: string) {
    if (!url.includes('tileset_info/?d=') || (!url.includes('https:') && !url.includes('http:'))) {
        // TODO: Add regular expression to validate the format.
        // console.warn(`Data url format is incorrect:${url}`);
        return { server: undefined, tilesetUid: undefined };
    }

    const server = url.split('tileset_info/?d=')[0];
    const tilesetUid = url.split('tileset_info/?d=')[1];
    return { server, tilesetUid };
}

export { getRelativeGenomicPosition } from './assembly';
