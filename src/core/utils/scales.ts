import { GoslingTrackModel } from '../gosling-track-model';
import { Assembly, Domain } from '../gosling.schema';
import { SUPPORTED_CHANNELS } from '../mark';
import {
    IsDomainChr,
    IsDomainInterval,
    IsDomainChrInterval,
    IsDomainGene,
    IsChannelDeep
} from '../gosling.schema.guards';
import { GET_CHROM_SIZES } from './assembly';
import { Chromosome } from './chrom-size';

/**
 * Get a numeric domain based on a domain specification.
 * For example, domain: { chromosome: '1', interval: [1, 300,000] } => domain: [1, 300,000]
 */
export function getNumericDomain(domain: Domain, assembly?: Assembly) {
    if ('chromosome' in domain) {
        if (domain.chromosome.includes('chr')) {
            domain.chromosome = domain.chromosome.replace('chr', '') as Chromosome;
        }
        if (!Object.keys(GET_CHROM_SIZES().interval).find(chr => chr === `chr${domain.chromosome}`)) {
            // we did not find any, so use '1' by default
            domain.chromosome = '1';
        }
    }
    if (IsDomainChr(domain)) {
        return [
            GET_CHROM_SIZES(assembly).interval[`chr${domain.chromosome}`][0] + 1,
            GET_CHROM_SIZES(assembly).interval[`chr${domain.chromosome}`][1]
        ];
    } else if (IsDomainInterval(domain)) {
        return domain.interval;
    } else if (IsDomainChrInterval(domain)) {
        const chrStart = GET_CHROM_SIZES(assembly).interval[`chr${domain.chromosome}`][0];
        const [start, end] = domain.interval;
        return [chrStart + start, chrStart + end];
    } else if (IsDomainGene(domain)) {
        // TODO: Not supported yet
    }
}

// TODO: IMPORTANT: when panning the tiles, the extent only becomes larger
/**
 * Use a shared scale (i.e., `domain`) across multiple gosling tracks.
 */
export function shareScaleAcrossTracks(trackModels: GoslingTrackModel[], force?: boolean) {
    // we update the spec with a global domain
    const globalDomain: { [k: string]: number[] | string[] } = {};
    const channelKeys = SUPPORTED_CHANNELS.filter(c => !c.includes('x'));

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
