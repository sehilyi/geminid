import type {
    CustomChannelDef,
    DataTransform,
    DataTransformWithBase,
    GoslingSpec,
    OverlaidTracks,
    TemplateTrackDef,
    TemplateTrackMappingDef,
    Track
} from '../gosling.schema';
import { IsTemplateTrack } from '../gosling.schema.guards';
import { traverseTracks } from '../../compiler/spec-preprocess';

/**
 * Track templates officially supported by Gosling.js.
 */
export const GoslingTemplates: TemplateTrackDef[] = [
    {
        name: 'gene',
        channels: [
            { name: 'startPosition', type: 'genomic', required: true },
            { name: 'endPosition', type: 'genomic', required: true },
            { name: 'strandColor', type: 'nominal', required: true },
            { name: 'strandRow', type: 'nominal', required: true },
            { name: 'opacity', type: 'value', required: false },
            { name: 'geneHeight', type: 'value', required: false },
            { name: 'geneLabel', type: 'nominal', required: true },
            { name: 'geneLabelColor', type: 'nominal', required: true },
            { name: 'geneLabelFontSize', type: 'value', required: false },
            { name: 'geneLabelStroke', type: 'value', required: false },
            { name: 'geneLabelStrokeThickness', type: 'value', required: false },
            { name: 'geneLabelOpacity', type: 'value', required: false },
            { name: 'type', type: 'nominal', required: true } // either 'gene' or 'exon'
        ],
        mapping: [
            {
                dataTransform: [
                    { type: 'filter', base: 'type', oneOf: ['gene'] },
                    { type: 'filter', base: 'strandColor', oneOf: ['-'] }
                ],
                mark: 'triangleLeft',
                x: { base: 'startPosition', type: 'genomic' },
                size: { base: 'geneHeight', value: 12 },
                row: { base: 'strandRow', type: 'nominal', domain: ['+', '-'] },
                color: { base: 'strandColor', type: 'nominal', domain: ['+', '-'], range: ['blue', 'red'] },
                opacity: { base: 'opacity', value: 0.4 },
                style: { align: 'right' }
            },
            {
                dataTransform: [
                    { type: 'filter', base: 'type', oneOf: ['gene'] },
                    { type: 'filter', base: 'strandColor', oneOf: ['+'] }
                ],
                mark: 'triangleRight',
                x: { base: 'endPosition', type: 'genomic' },
                size: { base: 'geneHeight', value: 12 },
                row: { base: 'strandRow', type: 'nominal', domain: ['+', '-'] },
                color: { base: 'strandColor', type: 'nominal', domain: ['+', '-'], range: ['blue', 'red'] },
                opacity: { base: 'opacity', value: 0.4 },
                style: { align: 'left' }
            },
            {
                dataTransform: [{ type: 'filter', base: 'type', oneOf: ['exon'] }],
                mark: 'rect',
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                size: { base: 'geneHeight', value: 12 },
                row: { base: 'strandRow', type: 'nominal', domain: ['+', '-'] },
                color: { base: 'strandColor', type: 'nominal', domain: ['+', '-'], range: ['blue', 'red'] },
                opacity: { base: 'opacity', value: 0.4 }
            },
            {
                dataTransform: [
                    { type: 'filter', base: 'type', oneOf: ['gene'] },
                    { type: 'filter', base: 'strandColor', oneOf: ['+'] }
                ],
                mark: 'rect',
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                row: { base: 'strandRow', type: 'nominal', domain: ['+', '-'] },
                color: { base: 'strandColor', type: 'nominal', domain: ['+', '-'], range: ['blue', 'red'] },
                opacity: { base: 'opacity', value: 0.4 },
                size: { value: 3 }
                // style: {
                //     linePattern: { type: 'triangleRight', size: 5 }
                // }
            },
            {
                dataTransform: [
                    { type: 'filter', base: 'type', oneOf: ['gene'] },
                    { type: 'filter', base: 'strandColor', oneOf: ['-'] }
                ],
                mark: 'rect',
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                row: { base: 'strandRow', type: 'nominal', domain: ['+', '-'] },
                color: { base: 'strandColor', type: 'nominal', domain: ['+', '-'], range: ['blue', 'red'] },
                opacity: { base: 'opacity', value: 0.4 },
                size: { value: 3 }
                // style: {
                //     linePattern: { type: 'triangleLeft', size: 5 }
                // }
            },
            {
                dataTransform: [{ type: 'filter', base: 'type', oneOf: ['gene'] }],
                mark: 'text',
                text: { base: 'geneLabel', type: 'nominal' }, // TODO: add dy here
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                row: { base: 'strandRow', type: 'nominal', domain: ['+', '-'] },
                color: { base: 'geneLabelColor', type: 'nominal', domain: ['+', '-'], range: ['blue', 'red'] },
                opacity: { base: 'opacity', value: 1 },
                size: { base: 'geneLabelFontSize', value: 18 },
                stroke: { base: 'geneLabelStroke', value: 'white' },
                strokeWidth: { base: 'geneLabelStrokeThickness', value: 2 },
                // TODO: how to redefine style from the users' side? (e.g., dy: -30)
                visibility: [
                    {
                        operation: 'less-than',
                        measure: 'width',
                        threshold: '|xe-x|',
                        transitionPadding: 10,
                        target: 'mark'
                    }
                ]
            }
        ]
    },
    {
        name: 'ideogram',
        channels: [
            { name: 'startPosition', type: 'genomic', required: true },
            { name: 'endPosition', type: 'genomic', required: true },
            { name: 'chrHeight', type: 'value', required: false }, // https://eweitz.github.io/ideogram/
            { name: 'name', type: 'nominal', required: true },
            { name: 'stainBackgroundColor', type: 'nominal', required: true },
            { name: 'stainLabelColor', type: 'nominal', required: true },
            { name: 'stainStroke', type: 'value', required: false },
            { name: 'stainStrokeWidth', type: 'value', required: false }
        ],
        mapping: [
            {
                mark: 'rect',
                dataTransform: [{ type: 'filter', base: 'stainBackgroundColor', oneOf: ['acen'], not: true }],
                color: {
                    base: 'stainBackgroundColor',
                    type: 'nominal',
                    domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar', 'acen'],
                    range: ['white', 'lightgray', 'gray', 'gray', 'black', '#7B9CC8', '#DC4542']
                },
                size: { base: 'chrHeight', value: 18 },
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                stroke: { base: 'stainStroke', value: 'gray' },
                strokeWidth: { base: 'stainStrokeWidth', value: 0.3 }
            },
            {
                mark: 'triangleRight',
                dataTransform: [
                    { type: 'filter', base: 'stainBackgroundColor', oneOf: ['acen'] },
                    { type: 'filter', base: 'name', include: 'q' }
                ],
                color: {
                    base: 'stainBackgroundColor',
                    type: 'nominal',
                    domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar', 'acen'],
                    range: ['white', 'lightgray', 'gray', 'gray', 'black', '#7B9CC8', '#DC4542']
                },
                size: { base: 'chrHeight', value: 18 },
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                stroke: { base: 'stainStroke', value: 'gray' },
                strokeWidth: { base: 'stainStrokeWidth', value: 0.3 }
            },
            {
                mark: 'triangleLeft',
                dataTransform: [
                    { type: 'filter', base: 'stainBackgroundColor', oneOf: ['acen'] },
                    { type: 'filter', base: 'name', include: 'p' }
                ],
                color: {
                    base: 'stainBackgroundColor',
                    type: 'nominal',
                    domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar', 'acen'],
                    range: ['white', 'lightgray', 'gray', 'gray', 'black', '#7B9CC8', '#DC4542']
                },
                size: { base: 'chrHeight', value: 18 },
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                stroke: { base: 'stainStroke', value: 'gray' },
                strokeWidth: { base: 'stainStrokeWidth', value: 0.3 }
            },
            {
                mark: 'text',
                dataTransform: [{ type: 'filter', base: 'stainLabelColor', oneOf: ['acen'], not: true }],
                color: {
                    base: 'stainLabelColor',
                    type: 'nominal',
                    domain: ['gneg', 'gpos25', 'gpos50', 'gpos75', 'gpos100', 'gvar'],
                    range: ['black', 'black', 'black', 'black', 'white', 'black']
                },
                text: { base: 'name', type: 'nominal' },
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                visibility: [
                    {
                        operation: 'less-than',
                        measure: 'width',
                        threshold: '|xe-x|',
                        transitionPadding: 10,
                        target: 'mark'
                    }
                ]
            }
        ]
    },
    {
        name: 'sequence',
        channels: [
            { name: 'startPosition', type: 'genomic', required: true },
            { name: 'endPosition', type: 'genomic', required: true },
            { name: 'barLength', type: 'quantitative', required: true },
            { name: 'baseBackground', type: 'nominal', required: true },
            { name: 'baseLabelColor', type: 'nominal', required: true },
            { name: 'baseLabelFontSize', type: 'value', required: false }
        ],
        mapping: [
            {
                mark: 'bar',
                // x: { base: 'position', type: 'genomic' },
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                y: { base: 'barLength', type: 'quantitative', axis: 'none' },
                color: { base: 'baseBackground', type: 'nominal', domain: ['A', 'T', 'G', 'C'] }
            },
            {
                dataTransform: [{ type: 'filter', base: 'barLength', oneOf: [0], not: true }],
                mark: 'text',
                x: { base: 'startPosition', type: 'genomic' },
                xe: { base: 'endPosition', type: 'genomic' },
                color: { base: 'baseLabelColor', type: 'nominal', domain: ['A', 'T', 'G', 'C'], range: ['white'] },
                text: { base: 'baseBackground', type: 'nominal' },
                size: { base: 'baseLabelFontSize', value: 18 },
                visibility: [
                    {
                        operation: 'less-than',
                        measure: 'width',
                        threshold: '|xe-x|',
                        transitionPadding: 30,
                        target: 'mark'
                    },
                    {
                        operation: 'LT',
                        measure: 'zoomLevel',
                        threshold: 10,
                        target: 'track'
                    }
                ]
            }
        ]
    }
];

/**
 * Replace track templetes to low-level gosling specs.
 * @param spec
 */
export function replaceTrackTemplates(spec: GoslingSpec, templates: TemplateTrackDef[]) {
    traverseTracks(spec, (t, i, ts) => {
        if (!IsTemplateTrack(t)) {
            // If this is not a template track, no point to replace templates.
            return;
        }

        const { template: name } = t;
        const templateDef = templates.find(d => d.name === name);

        /* Validation */
        if (!templateDef) {
            // No idea what this template is, so set a flag and remove it from the spec when compiling.
            t._invalidTrack = true;
            console.warn(`There is no track template named '${name}'`);
            return;
        }

        let isValid = true;
        templateDef.channels.forEach((d: CustomChannelDef) => {
            if (d.required && (!t.encoding || !(d.name in t.encoding))) {
                // Required channels are not defined
                isValid = false;
                console.warn(`A template spec ('${name}') does not contain a required channel, ${d.name}`);
            }
        });

        if (!isValid) {
            // The template spec is not valid for given template definition
            t._invalidTrack = true;
            return;
        }

        /* conversion */
        const viewBase = JSON.parse(JSON.stringify(t));
        if ('encoding' in viewBase) {
            delete viewBase.encoding;
        }
        const convertedView: OverlaidTracks = {
            ...viewBase,
            alignment: 'overlay',
            tracks: [],
            width: t.width ?? 100,
            height: t.height ?? 100
        };
        templateDef.mapping.forEach((singleTrackMappingDef: TemplateTrackMappingDef) => {
            // Set required properties
            const convertedTrack: Partial<Track> = {
                data: t.data,
                mark: singleTrackMappingDef.mark
            };

            // Handle data transform
            const { dataTransform } = singleTrackMappingDef;
            if (dataTransform) {
                const newDataTransform: DataTransform[] = [];
                dataTransform.map((dataTramsformMap: DataTransformWithBase) => {
                    const baseChannelName = dataTramsformMap.base;
                    if (
                        baseChannelName &&
                        t.encoding &&
                        baseChannelName in t.encoding &&
                        'field' in t.encoding[baseChannelName]
                    ) {
                        delete dataTramsformMap.base;
                        (dataTramsformMap as any).field = (t.encoding[baseChannelName] as any).field;
                        newDataTransform.push(dataTramsformMap as DataTransform);
                    } else {
                        // TODO: JUST ADD?
                    }
                });
            }

            // Handle encoding
            const encodingSpec = t.encoding;
            if (!encodingSpec) {
                // This means we do not need to override anything, so use default encodings
                Object.keys(singleTrackMappingDef)
                    .filter(k => k !== 'mark')
                    .forEach(channelKey => {
                        // Iterate all channels
                        const channelMap = JSON.parse(JSON.stringify((singleTrackMappingDef as any)[channelKey]));
                        if ('base' in channelMap) {
                            delete channelMap.base;
                        }
                        // @ts-ignore
                        convertedTrack[channelKey as keyof TemplateTrackMappingDef] = channelMap;
                    });
            } else {
                Object.keys(singleTrackMappingDef)
                    .filter(k => k !== 'mark')
                    .forEach(channelKey => {
                        // Iterate all channels
                        const channelMap = JSON.parse(JSON.stringify((singleTrackMappingDef as any)[channelKey]));
                        if ('base' in channelMap) {
                            const baseChannelName = channelMap.base;
                            if (baseChannelName in encodingSpec) {
                                // This means we need to override a user's spec for this channel
                                const base = JSON.parse(JSON.stringify(encodingSpec[baseChannelName]));
                                delete channelMap.base;
                                const newChannelSpec = Object.assign(channelMap, JSON.parse(JSON.stringify(base)));
                                convertedTrack[channelKey as keyof TemplateTrackMappingDef] = newChannelSpec;
                            } else {
                                // This means a user did not specify a optional custom channel, so just remove a `base` property.
                                delete channelMap.base;
                                convertedTrack[channelKey as keyof TemplateTrackMappingDef] = channelMap;
                            }
                        } else {
                            // This means we use encoding that is constant.
                            convertedTrack[channelKey as keyof TemplateTrackMappingDef] = channelMap;
                        }
                    });
            }

            convertedView.tracks.push(convertedTrack);
        });

        ts[i] = convertedView;
    });

    // DEBUG
    // console.log('After replaceTrackTemplates()', JSON.parse(JSON.stringify(spec)));
}
