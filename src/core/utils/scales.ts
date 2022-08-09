import type { GoslingTrackModel } from '../gosling-track-model';
import type { Assembly, Domain } from '../gosling.schema';
import { SUPPORTED_CHANNELS } from '../mark';
import { IsDomainChr, IsDomainInterval, IsDomainChrInterval, IsChannelDeep } from '../gosling.schema.guards';
import { GET_CHROM_SIZES } from './assembly';

/**
 * Get a numeric domain based on a domain specification.
 * For example, domain: { chromosome: 'chr1', interval: [1, 300,000] } => domain: [1, 300,000]
 */
export function getNumericDomain(domain: Domain, assembly?: Assembly) {
    if ('chromosome' in domain) {
        const isThereChr = Object.keys(GET_CHROM_SIZES(assembly).interval).find(chr => chr === domain.chromosome);
        if (!isThereChr) {
            // Did not find the chromosome, so return early.
            return;
        }
    }
    if (IsDomainChr(domain)) {
        return [
            GET_CHROM_SIZES(assembly).interval[domain.chromosome][0] + 1,
            GET_CHROM_SIZES(assembly).interval[domain.chromosome][1]
        ];
    } else if (IsDomainInterval(domain)) {
        return domain.interval;
    } else if (IsDomainChrInterval(domain)) {
        const chrStart = GET_CHROM_SIZES(assembly).interval[domain.chromosome][0];
        const [start, end] = domain.interval;
        return [chrStart + start, chrStart + end];
    }
}

// TODO: IMPORTANT: when panning the tiles, the extent only becomes larger
/**
 * Use a shared scale (i.e., `domain`) across multiple gosling tracks.
 */
export function shareScaleAcrossTracks(trackModels: GoslingTrackModel[], force?: boolean) {
    // we update the spec with a global domain
    const globalDomain: { [k: string]: number[] | string[] } = {};
    const channelKeys = SUPPORTED_CHANNELS;

    // generate global domains
    trackModels.forEach(model => {
        channelKeys.forEach(channelKey => {
            const channel = model.spec()[channelKey];
            if (!IsChannelDeep(channel) || channel.domain === undefined) {
                return;
            }

            const { domain, type } = channel;

            if (type === 'quantitative') {
                const numericDomain: number[] = Array.from(domain as number[]);
                if (!globalDomain[channelKey]) {
                    globalDomain[channelKey] = numericDomain;
                } else {
                    if (globalDomain[channelKey][0] > numericDomain[0]) {
                        // min
                        globalDomain[channelKey][0] = numericDomain[0];
                    }
                    if (globalDomain[channelKey][1] < numericDomain[1]) {
                        // max
                        globalDomain[channelKey][1] = numericDomain[1];
                    }
                }
            } else if (type === 'nominal') {
                const nominalDomain: string[] = Array.from(domain as string[]);
                if (!globalDomain[channelKey]) {
                    globalDomain[channelKey] = nominalDomain;
                } else {
                    globalDomain[channelKey] = Array.from(
                        new Set([...globalDomain[channelKey], ...nominalDomain])
                    ) as string[];
                }
            }
        });
    });

    // replace the domain and update scales
    trackModels.forEach(model => {
        channelKeys.forEach(channelKey => {
            const channel = model.spec()[channelKey];
            if (IsChannelDeep(channel) && channel.type === 'genomic') return;
            model.setChannelDomain(channelKey, globalDomain[channelKey], force);
            model.generateScales();
        });

        // update constant default values using the updated scales
        model.updateChannelValue();
    });
}
