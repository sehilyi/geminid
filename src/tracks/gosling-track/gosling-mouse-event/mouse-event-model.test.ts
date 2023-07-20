import { MouseEventModel } from './mouse-event-model';

describe('Mouse Event Model', () => {
    const model = new MouseEventModel();
    it('Empty Model', () => {
        expect(model.size()).toEqual(0);
        expect(model.find(0, 0)).toBeUndefined();
        expect(model.findAll(0, 0)).toHaveLength(0);
    });
    it('Add Data', () => {
        model.addLineBasedEvent({ type: 'line' }, [0, 0, 1, 1]);
        expect(model.size()).toEqual(1);

        model.addPointBasedEvent({ type: 'point' }, [100, 100, 10]);
        expect(model.size()).toEqual(2);

        // rectangle
        model.addPolygonBasedEvent({ type: 'polygon' }, [0, 0, 0, 100, 100, 100, 100, 0, 0]);
        expect(model.size()).toEqual(3);
    });
    it('Find Element Within Mouse', () => {
        expect(model.find(50, 50)?.value?.type).toEqual('polygon');
        expect(model.find(0, 0)?.value?.type).toEqual('line');
        expect(model.find(101, 101)?.value?.type).toEqual('point');
        expect(model.findAll(99, 99, true)).toHaveLength(2);

        // point is added earlier than polygon, so return point
        expect(model.find(100, 100)?.value?.type).toEqual('point');

        // find last
        expect(model.find(100, 100, true)?.value?.type).toEqual('point');
    });
});
