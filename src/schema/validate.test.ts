import { validateGoslingSpec } from './validate';
import { EX_SPEC_CYTOBANDS } from '../../../editor/example/json-spec/ideograms';

describe('Validate Spec', () => {
    it('Example Specs', () => {
        expect(validateGoslingSpec(EX_SPEC_CYTOBANDS).state).toEqual('success');
        expect(validateGoslingSpec(delete (EX_SPEC_CYTOBANDS as any).views).state).not.toEqual('success');
    });
});
