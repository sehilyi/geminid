import * as uuid from 'uuid';
import { HiGlassModel } from './higlass-model';
import { computeChromSizes } from './utils/assembly';
import { getTheme } from './utils/theme';

describe('Should produce higlass model correctly', () => {
    it('Should set default values correctly', () => {
        const higlass = new HiGlassModel();
        expect(higlass.spec().editable).toEqual(false);
    });

    it('Should set domain correctly', () => {
        const higlass = new HiGlassModel();
        higlass.addDefaultView(uuid.v1());
        higlass.setDomain({ chromosome: 'chr2' }, { chromosome: 'chr2', interval: [100, 200] });
        expect(higlass.spec().views?.[0].initialXDomain).toEqual([
            computeChromSizes().interval['chr2'][0] + 1,
            computeChromSizes().interval['chr2'][1]
        ]);
        expect(higlass.spec().views?.[0].initialYDomain?.[0]).toEqual(computeChromSizes().interval['chr2'][0] + 100);
        expect(higlass.spec().views?.[0].initialYDomain?.[1]).toEqual(computeChromSizes().interval['chr2'][0] + 200);
    });

    it('Should add brush correctly', () => {
        const higlass = new HiGlassModel();
        higlass.addDefaultView(uuid.v1());
        higlass.addBrush('linear', higlass.getLastView().uid ?? '', getTheme(), 'from');
        expect(JSON.stringify(higlass.spec())).toContain('viewport-projection-horizontal');
    });

    it('Should validate higlass spec correctly', () => {
        const higlass = new HiGlassModel();
        expect(higlass.validateSpec()).toEqual(true);
    });
});
