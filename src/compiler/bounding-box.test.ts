import type { GoslingSpec, Track } from '../gosling.schema';
import { DEFAULT_CIRCULAR_VIEW_PADDING, DEFAULT_VIEW_SPACING } from '../defaults';
import { getBoundingBox, getRelativeTrackInfo } from './bounding-box';
import { traverseToFixSpecDownstream } from '../../compiler/spec-preprocess';
import { getTheme } from './theme';

describe('Arrangement', () => {
    it('1 View, 1 Track', () => {
        const spec = { tracks: [{ overlay: [], width: 40, height: 40 }] };
        const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
        expect(info).toHaveLength(1);

        expect(info[0].track).toEqual(spec.tracks[0]);
        expect(info[0].boundingBox).toEqual({ x: 0, y: 0, width: 40, height: 40 });
        expect(info[0].layout).toEqual({ x: 0, y: 0, w: 12, h: 40 });
    });

    it('1 View, 1 Track (N Overlaid Tracks)', () => {
        const spec1 = {
            tracks: [
                { overlay: [], width: 40, height: 40 },
                { overlay: [], width: 40, height: 40, overlayOnPreviousTrack: true }
            ]
        };
        expect(getRelativeTrackInfo(spec1, getTheme()).trackInfos).toHaveLength(2);
        expect(getRelativeTrackInfo(spec1, getTheme()).trackInfos[1].boundingBox.y).toEqual(0);
    });

    it('1 View, 2 Tracks (N Overlaid Tracks)', () => {
        const spec1 = {
            tracks: [
                { overlay: [], width: 10, height: 10 },
                { overlay: [], width: 10, height: 10 }
            ]
        };
        const spec2 = {
            tracks: [
                { overlay: [{}, {}, {}], width: 10, height: 10 },
                { overlay: [], width: 10, height: 10 }
            ]
        };
        const spec3 = {
            tracks: [
                { overlay: [], width: 10, height: 10 },
                { overlay: [], width: 10, height: 10, overlayOnPreviousTrack: true },
                { overlay: [], width: 10, height: 10, overlayOnPreviousTrack: true },
                { overlay: [], width: 10, height: 10 }
            ]
        };
        expect(getBoundingBox(getRelativeTrackInfo(spec1, getTheme()).trackInfos)).toEqual(
            getBoundingBox(getRelativeTrackInfo(spec2, getTheme()).trackInfos)
        );
        expect(getBoundingBox(getRelativeTrackInfo(spec1, getTheme()).trackInfos)).toEqual(
            getBoundingBox(getRelativeTrackInfo(spec3, getTheme()).trackInfos)
        );
    });

    it('1 View, N Tracks', () => {
        const spec = {
            tracks: [
                { overlay: [], width: 10, height: 10 },
                { overlay: [], width: 10, height: 10 }
            ]
        };
        const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
        expect(info).toHaveLength(2);

        expect(info[0].track).toEqual(spec.tracks[0]);
        expect(info[0].boundingBox).toEqual({ x: 0, y: 0, width: 10, height: 10 });
        expect(info[0].layout).toEqual({ x: 0, y: 0, w: 12, h: 10 });

        expect(info[1].track).toEqual(spec.tracks[1]);
        expect(info[1].boundingBox).toEqual({ x: 0, y: 10, width: 10, height: 10 });
        expect(info[1].layout).toEqual({ x: 0, y: 10, w: 12, h: 10 });
    });

    it('Palallel Views', () => {
        const spec: GoslingSpec = {
            arrangement: 'parallel',
            views: [
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                },
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                }
            ]
        };
        const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
        expect(info).toHaveLength(4);

        const size = getBoundingBox(info);
        expect(size).toEqual({ width: 10, height: 40 + DEFAULT_VIEW_SPACING });

        expect(info[0].boundingBox).toEqual({ x: 0, y: 0, width: 10, height: 10 });
        expect(info[1].boundingBox).toEqual({ x: 0, y: 10, width: 10, height: 10 });
        expect(info[2].boundingBox).toEqual({ x: 0, y: 20 + DEFAULT_VIEW_SPACING, width: 10, height: 10 });
        expect(info[3].boundingBox).toEqual({ x: 0, y: 30 + DEFAULT_VIEW_SPACING, width: 10, height: 10 });
    });

    it('Serial Views', () => {
        const spec: GoslingSpec = {
            arrangement: 'serial',
            views: [
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                },
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                }
            ]
        };
        const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
        expect(info).toHaveLength(4);

        const size = getBoundingBox(info);
        expect(size).toEqual({ width: 20 + DEFAULT_VIEW_SPACING, height: 20 });

        expect(info[0].boundingBox).toEqual({ x: 0, y: 0, width: 10, height: 10 });
        expect(info[1].boundingBox).toEqual({ x: 0, y: 10, width: 10, height: 10 });
        expect(info[2].boundingBox).toEqual({ x: 10 + DEFAULT_VIEW_SPACING, y: 0, width: 10, height: 10 });
        expect(info[3].boundingBox).toEqual({ x: 10 + DEFAULT_VIEW_SPACING, y: 10, width: 10, height: 10 });
    });

    it('Parallel Views === VConcat Views in Linear Layout', () => {
        const spec1: GoslingSpec = {
            arrangement: 'parallel',
            views: [
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                },
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                }
            ]
        };
        const spec2: GoslingSpec = {
            arrangement: 'vertical',
            views: [
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                },
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                }
            ]
        };
        expect(getRelativeTrackInfo(spec1, getTheme())).toEqual(getRelativeTrackInfo(spec2, getTheme()));
    });

    it('Serial Views === HConcat Views in Linear Layout', () => {
        const spec1: GoslingSpec = {
            arrangement: 'serial',
            views: [
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                },
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                }
            ]
        };
        const spec2: GoslingSpec = {
            arrangement: 'horizontal',
            views: [
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                },
                {
                    tracks: [
                        { overlay: [], width: 10, height: 10 },
                        { overlay: [], width: 10, height: 10 }
                    ]
                }
            ]
        };
        expect(getRelativeTrackInfo(spec1, getTheme())).toEqual(getRelativeTrackInfo(spec2, getTheme()));
    });

    it('Complex Parallel Views in Linear Layout', () => {
        {
            const t = { overlay: [], width: 10, height: 10 };
            const spec: GoslingSpec = {
                arrangement: 'parallel',
                views: [
                    {
                        arrangement: 'parallel',
                        views: [{ tracks: [t] }]
                    },
                    {
                        arrangement: 'parallel',
                        views: [{ tracks: [t] }]
                    }
                ]
            };
            const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
            expect(info).toHaveLength(2);

            const size = getBoundingBox(info);
            expect(size).toEqual({ width: 10, height: 20 + DEFAULT_VIEW_SPACING });

            expect(info[0].boundingBox).toEqual({ x: 0, y: 0, width: 10, height: 10 });
            expect(info[1].boundingBox).toEqual({ x: 0, y: 10 + DEFAULT_VIEW_SPACING, width: 10, height: 10 });
        }
    });

    it('Complex Serial Views in Linear Layout', () => {
        {
            const t = { overlay: [], width: 10, height: 10 };
            const spec: GoslingSpec = {
                arrangement: 'serial',
                views: [
                    {
                        arrangement: 'serial',
                        views: [{ tracks: [t] }]
                    },
                    {
                        arrangement: 'serial',
                        views: [{ tracks: [t] }]
                    }
                ]
            };
            const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
            expect(info).toHaveLength(2);

            const size = getBoundingBox(info);
            expect(size).toEqual({ width: 20 + DEFAULT_VIEW_SPACING, height: 10 });

            expect(info[0].boundingBox).toEqual({ x: 0, y: 0, width: 10, height: 10 });
            expect(info[1].boundingBox).toEqual({ x: 10 + DEFAULT_VIEW_SPACING, y: 0, width: 10, height: 10 });
        }
    });

    it('Remove Brush in Combined Circular Views', () => {
        {
            const t: Track = JSON.parse(
                JSON.stringify({ overlay: [{ mark: 'brush', x: { linkingId: '_' } }], width: 10, height: 10 })
            );
            const spec: GoslingSpec = {
                layout: 'circular',
                arrangement: 'parallel',
                views: [
                    {
                        tracks: [t]
                    },
                    {
                        linkingId: '_',
                        tracks: [t]
                    }
                ]
            };
            traverseToFixSpecDownstream(spec);
            const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
            expect(info).toHaveLength(2);

            const size = getBoundingBox(info);
            expect(size).toEqual({
                width: 10 + DEFAULT_CIRCULAR_VIEW_PADDING * 2,
                height: 10 + DEFAULT_CIRCULAR_VIEW_PADDING * 2
            });

            expect(info[0].boundingBox).toEqual(info[1].boundingBox);
            expect((info[0].track as any).overlay).toHaveLength(0); // brush should be removed
        }
    });

    it('Complex Views in Linear Layout', () => {
        {
            const t = { overlay: [], width: 10, height: 10 };
            const spec1: GoslingSpec = {
                arrangement: 'parallel',
                views: [
                    { tracks: [t] },
                    {
                        arrangement: 'serial',
                        views: [{ tracks: [t] }]
                    }
                ]
            };
            const spec2: GoslingSpec = {
                arrangement: 'parallel',
                views: [{ tracks: [t] }, { tracks: [t] }]
            };
            expect(getRelativeTrackInfo(spec1, getTheme())).toEqual(getRelativeTrackInfo(spec2, getTheme()));
        }
        {
            const t = { overlay: [], width: 10, height: 10 };
            const spec1: GoslingSpec = {
                arrangement: 'serial',
                views: [
                    { tracks: [t] },
                    {
                        arrangement: 'serial',
                        views: [{ tracks: [t] }]
                    }
                ]
            };
            const spec2: GoslingSpec = {
                arrangement: 'serial',
                views: [{ tracks: [t] }, { tracks: [t] }]
            };
            expect(getRelativeTrackInfo(spec1, getTheme())).toEqual(getRelativeTrackInfo(spec2, getTheme()));
        }
        {
            const t = { overlay: [], width: 10, height: 10 };
            const spec: GoslingSpec = {
                arrangement: 'serial',
                views: [
                    {
                        arrangement: 'parallel',
                        views: [{ tracks: [t] }, { tracks: [t] }]
                    },
                    {
                        arrangement: 'serial',
                        views: [{ tracks: [t] }]
                    }
                ]
            };
            const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
            expect(info).toHaveLength(3);

            const size = getBoundingBox(info);
            expect(size).toEqual({ width: 20 + DEFAULT_VIEW_SPACING, height: 20 + DEFAULT_VIEW_SPACING });

            expect(info[0].boundingBox).toEqual({ x: 0, y: 0, width: 10, height: 10 });
            expect(info[1].boundingBox).toEqual({ x: 0, y: 10 + DEFAULT_VIEW_SPACING, width: 10, height: 10 });
            expect(info[2].boundingBox).toEqual({ x: 10 + DEFAULT_VIEW_SPACING, y: 0, width: 10, height: 10 });
        }
    });

    it('Uneven Size of Views', () => {
        {
            const t = { overlay: [], width: 10, height: 10 };
            const t_2w = { overlay: [], width: 20, height: 10 };
            const spec: GoslingSpec = {
                arrangement: 'serial',
                views: [
                    {
                        arrangement: 'parallel',
                        views: [{ tracks: [t] }, { tracks: [t_2w] }]
                    },
                    {
                        arrangement: 'serial',
                        views: [{ tracks: [t] }]
                    }
                ]
            };
            const info = getRelativeTrackInfo(spec, getTheme()).trackInfos;
            expect(info).toHaveLength(3);

            const size = getBoundingBox(info);
            expect(size).toEqual({ width: 30 + DEFAULT_VIEW_SPACING, height: 20 + DEFAULT_VIEW_SPACING });

            expect(info[0].boundingBox).toEqual({ x: 0, y: 0, width: 10, height: 10 });
            expect(info[1].boundingBox).toEqual({ x: 0, y: 10 + DEFAULT_VIEW_SPACING, width: 20, height: 10 });
            expect(info[2].boundingBox).toEqual({ x: 20 + DEFAULT_VIEW_SPACING, y: 0, width: 10, height: 10 });
        }
    });
});
