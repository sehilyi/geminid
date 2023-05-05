import gff from '@gmod/gff';

describe('gff parser', () => {
    it('Convert a VCF record to a tile data', () => {
        const parsed = gff.parseStringSync('1est\0\test');
        expect(parsed).toMatchInlineSnapshot(`
          [
            [
              {
                "attributes": {},
                "child_features": [],
                "derived_features": [],
                "end": NaN,
                "phase": undefined,
                "score": NaN,
                "seq_id": "1est ",
                "source": "est",
                "start": NaN,
                "strand": undefined,
                "type": undefined,
              },
            ],
          ]
        `);
    });
});
