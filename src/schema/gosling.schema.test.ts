import type { Channel, SingleTrack } from './gosling.schema';
import {
    IsChannelDeep,
    IsChannelValue,
    IsDomainChrInterval,
    getValueUsingChannel,
    IsStackedMark,
    IsStackedChannel,
    IsDataDeepTileset
} from '../core/gosling.schema.guards';

describe('gosling schema should be checked correctly', () => {
    it('Type guards should be checked correctly', () => {
        expect(IsChannelDeep({ value: 1 } as Channel)).toBe(false);
        expect(IsChannelDeep({ field: 'x' } as Channel)).toBe(true);
        expect(IsChannelValue({ value: 1 } as Channel)).toBe(true);
        expect(IsChannelValue({ field: 'x' } as Channel)).toBe(false);
        expect(IsDataDeepTileset({ type: 'multivec', url: '', column: 'c', row: 'r', value: 'v' })).toBe(true);
        expect(IsDomainChrInterval({ chromosome: 'chr1', interval: [1, 1000] })).toBe(true);
    });

    it('Should properly retreive values from data with channel spec', () => {
        expect(getValueUsingChannel({ x: 1 }, { field: 'x' } as Channel)).toBe(1);

        expect(getValueUsingChannel({ x: 1 }, { field: 'y' } as Channel)).toBeUndefined();
    });

    it('Spec for stacked bar/area charts should be detected as using a stacked mark', () => {
        expect(
            IsStackedMark({
                mark: 'bar',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'nominal' }
            } as SingleTrack)
        ).toBe(true);

        expect(
            IsStackedMark({
                mark: 'area',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'nominal' }
            } as SingleTrack)
        ).toBe(true);
    });

    it('Spec for regular charts without stacking marks should be detected as using a non-stacked mark', () => {
        expect(
            IsStackedMark({
                mark: 'bar',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'quantitative' }
            } as SingleTrack)
        ).toBe(false);

        expect(
            IsStackedMark({
                mark: 'bar',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'nominal' },
                row: { field: 'y', type: 'nominal' }
            } as SingleTrack)
        ).toBe(false);

        expect(
            IsStackedMark({
                mark: 'line',
                x: { field: 'x', type: 'genomic' },
                y: { field: 'y', type: 'quantitative' },
                color: { field: 'y', type: 'nominal' }
            } as SingleTrack)
        ).toBe(false);
    });

    it('Stacked channels should be detected correctly', () => {
        expect(
            IsStackedChannel(
                {
                    mark: 'bar',
                    x: { field: 'x', type: 'genomic' },
                    y: { field: 'y', type: 'quantitative' },
                    color: { field: 'y', type: 'nominal' }
                } as SingleTrack,
                'y'
            )
        ).toBe(true);

        expect(
            IsStackedChannel(
                {
                    mark: 'bar',
                    x: { field: 'x', type: 'genomic' },
                    y: { field: 'y', type: 'quantitative' },
                    color: { field: 'y', type: 'nominal' }
                } as SingleTrack,
                'x'
            )
        ).toBe(false);
    });
});
