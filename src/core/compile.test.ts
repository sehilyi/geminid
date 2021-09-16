import { EX_SPEC_VISUAL_ENCODING } from '../../editor/example/visual-encoding';
import { compile } from './compile';
import { getTheme } from './utils/theme';

describe('compile', () => {
    it('compile should not touch the original spec of users', () => {
        const spec = JSON.parse(JSON.stringify(EX_SPEC_VISUAL_ENCODING));
        compile(spec, () => {}, [], getTheme());
        expect(JSON.stringify(spec)).toEqual(JSON.stringify(EX_SPEC_VISUAL_ENCODING));
    });
});
