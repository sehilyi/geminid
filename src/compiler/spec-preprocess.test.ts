import type { GoslingSpec, SingleView, Track } from '../gosling.schema';
import { getBoundingBox, getRelativeTrackInfo } from './bounding-box';
import { traverseToFixSpecDownstream, overrideDataTemplates, convertToFlatTracks } from './spec-preprocess';
import { getTheme } from './theme';

describe('Fix Spec Downstream', () => {
    it('Empty Views', () => {
        const info = getRelativeTrackInfo(
            {
                arrangement: 'parallel',
                views: [
                    {
                        tracks: []
                    }
                ]
            },
            getTheme()
        ).trackInfos;
        const size = getBoundingBox(info);
        expect(!isNaN(+size.width) && isFinite(size.width)).toEqual(true);
        expect(!isNaN(+size.height) && isFinite(size.height)).toEqual(true);
    });

    it('style', () => {
        {
            const spec: GoslingSpec = {
                style: { outline: 'red' },
                views: [{ tracks: [{ overlay: [], width: 0, height: 0 }] }]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as SingleView).style?.outline).toEqual('red');
            expect((spec.views[0] as SingleView).tracks[0].style?.outline).toEqual('red');
        }
        {
            const spec: GoslingSpec = {
                style: { outline: 'red' },
                views: [{ tracks: [{ overlay: [], width: 0, height: 0, style: { outline: 'green' } }] }]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as SingleView).style?.outline).toEqual('red');
            expect((spec.views[0] as SingleView).tracks[0].style?.outline).toEqual('green');
        }
    });

    it('static', () => {
        {
            const spec: GoslingSpec = {
                static: true,
                arrangement: 'parallel',
                views: [{ tracks: [{ overlay: [], width: 0, height: 0 }] }]
            };
            traverseToFixSpecDownstream(spec);
            expect(spec.views[0].static).toEqual(true);
            expect((spec.views[0] as any).tracks[0].static).toEqual(true);
        }
        {
            const spec: GoslingSpec = {
                layout: 'circular',
                arrangement: 'parallel',
                views: [{ layout: 'linear', tracks: [{ overlay: [], width: 0, height: 0 }] }]
            };
            traverseToFixSpecDownstream(spec);
            expect(spec.views[0].static).toEqual(false);
            expect((spec.views[0] as any).tracks[0].static).toEqual(false);
        }
    });

    it('flipY if the last track (i !== 0) is using a `withinLink` mark', () => {
        {
            const spec: GoslingSpec = {
                static: true,
                arrangement: 'parallel',
                views: [{ tracks: [{ overlay: [], mark: 'withinLink', width: 0, height: 0 }] }]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as any).tracks[0].flipY).toBeUndefined(); // must not flip if there is only one track
        }
        {
            const spec: GoslingSpec = {
                static: true,
                arrangement: 'parallel',
                views: [
                    {
                        tracks: [
                            { overlay: [], width: 0, height: 0 },
                            { overlay: [], mark: 'withinLink', width: 0, height: 0 }
                        ]
                    }
                ]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as any).tracks[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].flipY).toEqual(true);
        }
        {
            const spec: GoslingSpec = {
                static: true,
                arrangement: 'parallel',
                views: [
                    {
                        tracks: [
                            { overlay: [], width: 0, height: 0 },
                            { overlay: [{ mark: 'withinLink' }], width: 0, height: 0 }
                        ]
                    }
                ]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as any).tracks[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].overlay[0].flipY).toEqual(true);
        }
        {
            const spec: GoslingSpec = {
                static: true,
                arrangement: 'parallel',
                views: [
                    {
                        tracks: [
                            { overlay: [{ mark: 'withinLink' }], width: 0, height: 0 },
                            { overlay: [{ mark: 'withinLink' }], width: 0, height: 0, overlayOnPreviousTrack: true }
                        ]
                    }
                ]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as any).tracks[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].flipY).toBeUndefined();
            // only one track, so no flip on both
            expect((spec.views[0] as any).tracks[0].overlay[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].overlay[0].flipY).toBeUndefined();
        }
        {
            const spec: GoslingSpec = {
                static: true,
                arrangement: 'parallel',
                views: [
                    {
                        tracks: [
                            { overlay: [], width: 0, height: 0 },
                            { overlay: [{ mark: 'withinLink' }], width: 0, height: 0 },
                            { overlay: [{ mark: 'withinLink' }], width: 0, height: 0, overlayOnPreviousTrack: true }
                        ]
                    }
                ]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as any).tracks[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].flipY).toBeUndefined();
            // only one track, so no flip on both
            expect((spec.views[0] as any).tracks[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].overlay[0].flipY).toBe(true);
            expect((spec.views[0] as any).tracks[2].overlay[0].flipY).toBe(true);
        }
        {
            const spec: GoslingSpec = {
                static: true,
                arrangement: 'parallel',
                views: [
                    {
                        tracks: [
                            { overlay: [], width: 0, height: 0 },
                            { overlay: [{ mark: 'withinLink' }], width: 0, height: 0, overlayOnPreviousTrack: true },
                            { overlay: [{ mark: 'withinLink' }], width: 0, height: 0, overlayOnPreviousTrack: true }
                        ]
                    }
                ]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as any).tracks[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].flipY).toBeUndefined();
            // only one track, so no flip on both
            expect((spec.views[0] as any).tracks[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[1].overlay[0].flipY).toBeUndefined();
            expect((spec.views[0] as any).tracks[2].overlay[0].flipY).toBeUndefined();
        }
    });

    it('arrangement should be overriden', () => {
        {
            const spec: GoslingSpec = {
                static: true,
                arrangement: 'serial',
                views: [{ views: [{ tracks: [{ overlay: [], width: 0, height: 0 }] }] }]
            };
            traverseToFixSpecDownstream(spec);
            expect((spec.views[0] as any).arrangement).toEqual('serial');
        }
        {
            const spec: GoslingSpec = {
                static: true,
                views: [{ views: [{ tracks: [{ overlay: [], width: 0, height: 0 }] }] }]
            };
            traverseToFixSpecDownstream(spec);
            expect(spec.arrangement).toEqual('vertical'); // default one
            expect((spec.views[0] as any).arrangement).toEqual('vertical'); // default one is overriden
        }
    });

    it('spacing should be overriden to views but not tracks', () => {
        {
            const spec: GoslingSpec = {
                arrangement: 'parallel',
                spacing: 24,
                views: [
                    {
                        arrangement: 'serial',
                        views: [{ tracks: [{ overlay: [], width: 0, height: 0 }] }]
                    }
                ]
            };
            traverseToFixSpecDownstream(spec);
            expect(spec.views[0].spacing).toEqual(24);
            expect((spec.views[0] as any).views[0].spacing).toBeUndefined();
        }
    });

    it('Layout in Tracks Should Be Removed', () => {
        const spec: GoslingSpec = {
            arrangement: 'parallel',
            views: [
                {
                    tracks: [{ layout: 'circular', overlay: [], width: 0, height: 0 }]
                }
            ]
        };
        traverseToFixSpecDownstream(spec);
        expect((spec.views[0] as any).tracks[0].layout).toEqual('linear');
    });
});

describe('Spec Preprocess', () => {
    it('overlayOnPreviousTrack', () => {
        const spec: GoslingSpec = {
            layout: 'circular',
            tracks: [
                { data: { type: 'csv', url: '' }, mark: 'bar', overlayOnPreviousTrack: true, width: 100, height: 100 }
            ]
        };
        traverseToFixSpecDownstream(spec);

        // Should be fixed to `false` since the first track do not have a previoous track
        expect(spec.tracks[0].overlayOnPreviousTrack).toEqual(false);
    });

    it('circular layout', () => {
        const spec: GoslingSpec = {
            layout: 'circular',
            tracks: [{} as Track, { static: false } as Track]
        };
        traverseToFixSpecDownstream(spec);

        expect(spec.tracks[0].layout).toEqual('circular');

        // By default, `static` option is `false`.
        expect(spec.tracks[0].static).toEqual(false);

        // The `static` option shouldn't be changed if it is defined by a user.
        expect(spec.tracks[1].static).toEqual(false);
    });

    it('override template (higlass-vector)', () => {
        const spec: GoslingSpec = {
            tracks: [{ data: { type: 'vector', url: '', column: 'c', value: 'v' }, overrideTemplate: true } as Track]
        };
        overrideDataTemplates(spec);
        expect(spec.tracks[0]).toHaveProperty('mark');
    });

    it('override template (higlass-multivec)', () => {
        {
            const spec: GoslingSpec = {
                tracks: [
                    {
                        data: { type: 'multivec', url: '', row: 'r', column: 'c', value: 'v' },
                        overrideTemplate: true
                    } as Track
                ]
            };
            overrideDataTemplates(spec);
            expect(spec.tracks[0]).toHaveProperty('mark');
        }
        {
            const spec: GoslingSpec = {
                tracks: [{ data: { type: 'multivec', url: '', row: 'r', column: 'c', value: 'v' } } as Track]
            };
            overrideDataTemplates(spec);
            expect(spec.tracks[0]).not.toHaveProperty('mark'); // overrideTemplate is not set, so do not override templates
        }
    });

    it('Convert To FlatTracks', () => {
        const dummySpec: Track = { data: { type: 'csv', url: '' }, mark: 'bar', width: 10, height: 10 };
        {
            const flat = convertToFlatTracks({
                tracks: []
            });
            expect(flat).toHaveLength(0);
        }
        {
            const flat = convertToFlatTracks({
                tracks: [{ ...dummySpec, title: 'A' }]
            });
            expect(flat).toHaveLength(1);
            expect(flat[0].title).toEqual('A');
        }
        {
            const flat = convertToFlatTracks({
                tracks: [
                    { ...dummySpec, title: 'A' },
                    { title: 'B', alignment: 'overlay', tracks: [{ ...dummySpec }], width: 10, height: 10 }
                ]
            });

            expect(flat).toHaveLength(2);
            expect(flat[0].title).toEqual('A');
            expect(flat[1].title).toEqual('B');
            expect('overlay' in flat[1]).toEqual(true);
            expect('overlay' in flat[1] && flat[1].overlay.length === 1).toEqual(true);
        }
        {
            const flat2 = convertToFlatTracks({
                alignment: 'stack',
                color: { value: 'red' }, // should be overriden
                tracks: [
                    { ...dummySpec, title: 'A' },
                    { title: 'B', alignment: 'overlay', tracks: [{ ...dummySpec }], width: 10, height: 10 }
                ]
            });
            expect((flat2[0] as any).color).toEqual({ value: 'red' });
        }
        {
            const flat = convertToFlatTracks({
                tracks: [
                    { ...dummySpec, title: 'A' },
                    { title: 'B', alignment: 'overlay', tracks: [{ ...dummySpec }], width: 10, height: 10 }
                ]
            });
            // Should be consistent when called multiple times.
            expect(flat).toEqual(convertToFlatTracks({ tracks: flat }));
            expect(flat).toEqual(convertToFlatTracks({ tracks: convertToFlatTracks({ tracks: flat }) }));
        }
    });
});
