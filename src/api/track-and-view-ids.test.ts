import type { GoslingSpec } from '@gosling.schema';
import { getInternalSpecById, getTrackIds, getViewIds } from './track-and-view-ids';

describe('Retrieve IDs and Sub-spec', () => {
    it('Nested Spec', () => {
        const nested: GoslingSpec = {
            views: [
                {
                    id: 'a',
                    views: [
                        {
                            id: 'b',
                            tracks: [
                                {
                                    id: 'c'
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        expect(getViewIds(nested)).toEqual(['a', 'b']);
        expect(getTrackIds(nested)).toEqual(['c']);
        expect(getInternalSpecById(nested, 'b')).toMatchInlineSnapshot(`
          {
            "id": "b",
            "tracks": [
              {
                "id": "c",
              },
            ],
          }
        `);
    });
    it('Nested Spec with Overlaid Track', () => {
        const overlay: GoslingSpec = {
            views: [
                {
                    id: 'a',
                    views: [
                        {
                            id: 'b',
                            tracks: [
                                {
                                    alignment: 'overlay',
                                    id: 'c',
                                    tracks: [
                                        {
                                            id: 'd'
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        expect(getViewIds(overlay)).toEqual(['a', 'b', 'c']);
        expect(getTrackIds(overlay)).toEqual(['d']);
        expect(getInternalSpecById(overlay, 'c')).toMatchInlineSnapshot(`
          {
            "alignment": "overlay",
            "id": "c",
            "tracks": [
              {
                "id": "d",
              },
            ],
          }
        `);
    });
});
