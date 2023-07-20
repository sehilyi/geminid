import { PRINT_RENDERING_CYCLE } from './gosling-track';

describe('Check debug-purpose variables', () => {
    it('PRINT_RENDERING_CYCLE', () => {
        expect(PRINT_RENDERING_CYCLE).toBe(false);
    });
});
