import { filterData, calculateData, aggregateData, splitExon, inferSvType, displace } from './data-transform';
import { scaleLinear } from 'd3-scale';

describe('Data Transformation', () => {
    it('Filter', () => {
        let filtered = filterData({ type: 'filter', field: 'c', oneOf: ['a'] }, [
            { c: 'a', q: 1 },
            { c: 'b', q: '1' }, // string should be converted
            { c: 'a', q: 3 },
            { c: 'b', q: 4 },
            { c: 'b', q: '4' } // string should be converted
        ]);
        filtered = filterData({ type: 'filter', field: 'q', inRange: [1, 3.5] }, filtered);
        expect(filtered).toMatchInlineSnapshot(`
          [
            {
              "c": "a",
              "q": 1,
            },
            {
              "c": "a",
              "q": 3,
            },
          ]
        `);
    });
    it('Pile', () => {
        const data = [
            { s: 2, e: 3 },
            { s: 4, e: 6 },
            { s: 1, e: 2 },
            { s: 1, e: 3 }
        ];
        const scale = scaleLinear().domain([1, 10]).range([1, 1000]);
        expect(
            displace(
                { type: 'displace', method: 'pile', boundingBox: { startField: 's', endField: 'e' }, newField: 'row' },
                data,
                scale
            )
        ).toMatchInlineSnapshot(`
          [
            {
              "e": 2,
              "row": "0",
              "s": 1,
            },
            {
              "e": 3,
              "row": "1",
              "s": 1,
            },
            {
              "e": 3,
              "row": "2",
              "s": 2,
            },
            {
              "e": 6,
              "row": "0",
              "s": 4,
            },
          ]
        `);
        expect(
            displace(
                { type: 'displace', method: 'pile', boundingBox: { startField: 's', endField: 's' }, newField: 'row' },
                data,
                scale
            )
        ).toMatchInlineSnapshot(`
          [
            {
              "e": 2,
              "row": "0",
              "s": 1,
            },
            {
              "e": 3,
              "row": "1",
              "s": 1,
            },
            {
              "e": 3,
              "row": "0",
              "s": 2,
            },
            {
              "e": 6,
              "row": "0",
              "s": 4,
            },
          ]
        `);
        expect(
            displace(
                {
                    type: 'displace',
                    method: 'pile',
                    boundingBox: { startField: 's', endField: 'e', padding: 1, isPaddingBP: true },
                    newField: 'row'
                },
                data,
                scale
            )
        ).toMatchInlineSnapshot(`
          [
            {
              "e": 2,
              "row": "0",
              "s": 1,
            },
            {
              "e": 3,
              "row": "1",
              "s": 1,
            },
            {
              "e": 3,
              "row": "2",
              "s": 2,
            },
            {
              "e": 6,
              "row": "3",
              "s": 4,
            },
          ]
        `);
    });
    it('SV', () => {
        const svTypes = inferSvType(
            {
                type: 'svType',
                firstBp: { chrField: 'chr1', posField: 'start1', strandField: 'strand1' },
                secondBp: { chrField: 'chr2', posField: 'start2', strandField: 'strand2' },
                newField: 'svclass'
            },
            [
                {
                    chr1: 7,
                    start1: 51456884,
                    chr2: 7,
                    start2: 51457472,
                    strand1: '+',
                    strand2: '-'
                },
                {
                    chr1: 10,
                    start1: 72295397,
                    chr2: 10,
                    start2: 1000,
                    strand1: '-',
                    strand2: '-'
                },
                {
                    chr1: 10,
                    start1: 133252888,
                    chr2: 10,
                    start2: 1000,
                    strand1: '+',
                    strand2: '-'
                },
                {
                    chr1: 10,
                    start1: 134996297,
                    chr2: 10,
                    start2: 134996635,
                    strand1: '+',
                    strand2: '+'
                },
                {
                    chr1: 1,
                    start1: 169963,
                    chr2: 2,
                    start2: 170300,
                    strand1: '+',
                    strand2: '-'
                }
            ]
        );
        expect(svTypes).toHaveLength(5);
        expect(svTypes.map(d => d['svclass'])).toEqual(['DEL', 't2tINV', 'DUP', 'h2hINV', 'TRA']);
    });
    it('Log', () => {
        {
            const log = calculateData({ type: 'log', field: 'q', base: 2 }, [
                { c: 'a', q: 1 },
                { c: 'a', q: 3 },
                { c: 'b', q: 4 }
            ]);
            expect(log).toHaveLength(3);
            expect(log.filter(d => d['c'] === 'b')[0]['q']).toBeCloseTo(Math.log2(4), 10);
        }
        {
            // default base is 10
            const log = calculateData({ type: 'log', field: 'q' }, [
                { c: 'a', q: 1 },
                { c: 'a', q: 3 },
                { c: 'b', q: 4 }
            ]);
            expect(log).toHaveLength(3);
            expect(log.filter(d => d['c'] === 'b')[0]['q']).toBeCloseTo(Math.log10(4), 10);
        }
    });
    it('Exon Split', () => {
        {
            const exon = splitExon(
                {
                    type: 'exonSplit',
                    separator: ',',
                    flag: { field: 'type', value: 'exon' },
                    fields: [
                        { field: 'es', type: 'genomic', newField: 'es', chrField: 'c' },
                        { field: 'ee', type: 'genomic', newField: 'ee', chrField: 'c' }
                    ]
                },
                [{ c: 'chr3', es: '1,2,3', ee: '2,3,4' }],
                'hg38'
            );
            expect(exon).toHaveLength(4);
            expect(exon[0]).toEqual({ c: 'chr3', es: '1,2,3', ee: '2,3,4' });
            expect(exon.filter(d => d['type'] === 'exon')).toHaveLength(3);
        }
        {
            // default base is 10
            const log = calculateData({ type: 'log', field: 'q' }, [
                { c: 'a', q: 1 },
                { c: 'a', q: 3 },
                { c: 'b', q: 4 }
            ]);
            expect(log).toHaveLength(3);
            expect(log.filter(d => d['c'] === 'b')[0]['q']).toBeCloseTo(Math.log10(4), 10);
        }
    });
    it('Aggregate', () => {
        const aggregated = aggregateData(
            {
                data: { type: 'csv', url: '' },
                mark: 'point',
                color: { field: 'c', type: 'nominal' },
                y: { field: 'q', type: 'quantitative', aggregate: 'max' },
                width: 100,
                height: 100
            },
            [
                { c: 'a', q: 1 },
                { c: 'a', q: 3 },
                { c: 'b', q: 4 }
            ]
        );
        expect(aggregated).toHaveLength(2);
        expect(aggregated.filter(d => d['c'] === 'a')[0]['q']).toEqual(3);
        expect(aggregated.filter(d => d['c'] === 'b')[0]['q']).toEqual(4);

        const noChange = aggregateData(
            {
                data: { type: 'csv', url: '' },
                mark: 'point',
                // no categorical field should not work
                y: { field: 'q', type: 'quantitative', aggregate: 'max' },
                width: 100,
                height: 100
            },
            [
                { c: 'a', q: 1 },
                { c: 'a', q: 3 },
                { c: 'b', q: 4 }
            ]
        );
        expect(noChange).toHaveLength(3);
    });
});
