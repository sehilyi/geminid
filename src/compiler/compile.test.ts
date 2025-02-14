import { EX_SPEC_VISUAL_ENCODING } from '../../editor/example/json-spec/visual-encoding';
import { compile } from './compile';
import { getTheme } from '../core/utils/theme';
import type { GoslingSpec } from '../index';
import { convertToFlatTracks } from './spec-preprocess';
import type { SingleView } from '@gosling-lang/gosling-schema';
import { spreadTracksByData } from '../core/utils/overlay';
import { getDataFetcher } from '../../demo/renderer/dataFetcher';
import type { ProcessedTrack } from '../track-def/types';

// TODO: Move this to dataFetcher.test.ts after we move the /demo/renderer under /src
describe('Compiler with UrlToFetchOptions', () => {
    it('passes UrlToFetchOptions to the data fetcher', () => {
        const urlToFetchOptions = { 'https://my-csv-url.com': { headers: { Authentication: 'Bearer 1234' } } };
        const spec: ProcessedTrack = {
            static: true,
            orientation: 'horizontal',
            id: 'track-id',
            data: {
                type: 'csv',
                url: 'https://my-csv-url.com'
            },
            mark: 'rect',
            width: 100,
            height: 100
        };
        const df = getDataFetcher(spec, urlToFetchOptions);
        expect(df).toMatchInlineSnapshot(`
          CsvDataFetcherClass {
            "dataConfig": {
              "assembly": undefined,
              "type": "csv",
              "url": "https://my-csv-url.com",
              "urlFetchOptions": {
                "headers": {
                  "Authentication": "Bearer 1234",
                },
              },
            },
            "tilesetInfoLoading": false,
          }
        `);
    });
});

describe('compile', () => {
    it('compile should not touch the original spec of users', () => {
        const spec = JSON.parse(JSON.stringify(EX_SPEC_VISUAL_ENCODING));
        compile(spec, [], getTheme(), {});
        expect(JSON.stringify(spec)).toEqual(JSON.stringify(EX_SPEC_VISUAL_ENCODING));
    });
});

describe('Dummy track', () => {
    it('compiles when layout linear', () => {
        const spec: GoslingSpec = {
            tracks: [
                {
                    type: 'dummy-track',
                    id: 'my-dummy-track',
                    title: 'Placeholder',
                    style: {
                        background: '#000',
                        textFontSize: 10,
                        textStroke: 'normal',
                        textStrokeWidth: 0.2
                    }
                }
            ],
            layout: 'linear'
        };
        const { gs } = compile(spec, [], getTheme(), {});
        expect('tracks' in gs && gs.tracks[0]).toMatchInlineSnapshot(`
          {
            "assembly": "hg38",
            "centerRadius": 0.3,
            "height": 130,
            "id": "my-dummy-track",
            "layout": "linear",
            "orientation": "horizontal",
            "overlayOnPreviousTrack": false,
            "spacing": 10,
            "static": false,
            "style": {
              "background": "#000",
              "textFontSize": 10,
              "textStroke": "normal",
              "textStrokeWidth": 0.2,
            },
            "title": "Placeholder",
            "type": "dummy-track",
            "width": 600,
            "xOffset": 0,
            "yOffset": 0,
            "zoomLimits": [
              1,
              null,
            ],
          }
        `);
    });
    it('gets filtered out when layout circular', () => {
        const spec: GoslingSpec = {
            tracks: [
                {
                    type: 'dummy-track',
                    id: 'dummy-1'
                },
                {
                    id: 'track-id',
                    data: {
                        type: 'csv',
                        url: ''
                    },
                    mark: 'rect',
                    width: 100,
                    height: 100
                }
            ],
            layout: 'circular'
        };
        const { gs } = compile(spec, [], getTheme(), {});
        expect('tracks' in gs && gs.tracks).toHaveLength(1);
    });
});

describe('Maintain IDs', () => {
    it('Overlaid tracks', () => {
        const twoTracksWithDiffData: SingleView = {
            alignment: 'overlay',
            tracks: [
                {
                    id: 'first',
                    data: { type: 'csv', url: 'http://abc' }
                },
                {
                    id: 'second',
                    data: { type: 'csv', url: 'http://def' }
                }
            ]
        };
        const flattened = convertToFlatTracks(twoTracksWithDiffData);
        const spread = spreadTracksByData(flattened);
        expect(spread.map(d => d.id)).toEqual(['first', 'second']);
    });
});
