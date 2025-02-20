import type { GoslingSpec } from '@gosling-lang/gosling-schema';
import { replaceDisplacements } from './normalize';

vi.mock('uuid', () => '1');

describe('normalize spec', () => {
    it('displacement', () => {
        const spec: GoslingSpec = {
            tracks: [
                {
                    displacement: { type: 'pile' },
                    x: { field: 'x' },
                    xe: { field: 'xe' }
                }
            ]
        };
        replaceDisplacements(spec);
        // TODO: need to mock the uuid
        // expect(spec).toMatchInlineSnapshot();
    });
});
