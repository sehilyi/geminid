import { test, expect } from '@playwright/experimental-ct-react';
import { GoslingComponent } from '../src/core/gosling-component';
import { spec as JSON_SPEC_VISUAL_ENCODING } from '../editor/example/spec/visual-encoding';
import { JsonExampleSpecs } from 'editor/example/json-spec';
import React from 'react';
import type { GoslingSpec } from 'gosling.js';

test.use({ viewport: { width: 1000, height: 1000 } });

async function zoom(direction: 'in' | 'out', page: any, steps = 15) {
    const zoomDirection = direction === 'in' ? -1 : 1; // Zoom in or out
    for (let i = 0; i < steps; i++) {
        await page.mouse.wheel(0, zoomDirection * 50);
    }
}
/**
 * This tests the zooming performance of Gosling. It zooms in and out 15 times and records the time it takes to zoom.
 */
// test('Zoom visual encoding', async ({ mount, page }) => {
//     test.setTimeout(60000); // 60 seconds
//     await mount(<GoslingComponent spec={JSON_SPEC_VISUAL_ENCODING} />);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(5000);

//     const centerTrack = page.locator('.center-track').first();
//     await centerTrack.hover();

//     // Start timer and zoom in
//     const zoomTimes: number[] = [];
//     for (let i = 0; i < 15; i++) {
//         const startTime = Date.now();
//         await zoom('in', page);
//         const endTime = Date.now();
//         const zoomTime = endTime - startTime;
//         zoomTimes.push(zoomTime);
//         console.warn(`Zoom time ${i + 1}: ${zoomTime}ms`);
//         await zoom('out', page);
//     }
//     console.warn('Minimum:', Math.min(...zoomTimes));
//     expect(Math.min(...zoomTimes)).toBeLessThan(330);

//     // const screenshot = await component.screenshot();
//     // await testInfo.attach('gosComponentScreenshot', {
//     //     body: screenshot,
//     //     contentType: 'image/png'
//     // });
// });

// test('Zoom multiple sequence alignment', async ({ mount, page }) => {
//     test.setTimeout(60000); // 60 seconds
//     await mount(<GoslingComponent spec={JsonExampleSpecs.EX_SPEC_ALIGNMENT_CHART} />);
//     await page.waitForLoadState('networkidle');
//     await page.waitForTimeout(5000);

//     // Hover over the third track
//     const centerTracks = page.locator('.center-track');
//     const thirdCenterTrack = centerTracks.nth(2);
//     await thirdCenterTrack.hover();

//     const zoomTimes: number[] = [];
//     for (let i = 0; i < 10; i++) {
//         const startTime = Date.now();
//         await zoom('in', page, 5);
//         const endTime = Date.now();
//         const zoomTime = endTime - startTime;
//         zoomTimes.push(zoomTime);
//         console.warn(`Zoom time ${i + 1}: ${zoomTime}ms`);
//         await zoom('out', page);
//     }
//     console.warn('Minimum:', Math.min(...zoomTimes));
//     expect(Math.min(...zoomTimes)).toBeLessThan(500);
// });

const spec = {
    layout: 'linear',
    data: {
        values: [
            {
                chr: 'chr2',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 1
            },
            {
                chr: 'chr4',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 2
            },
            {
                chr: 'chr6',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 3
            },
            {
                chr: 'chr8',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 4
            },
            {
                chr: 'chr10',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 5
            },
            {
                chr: 'chr12',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 6
            },
            {
                chr: 'chr14',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 7
            },
            {
                chr: 'chr16',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 6
            },
            {
                chr: 'chr18',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 5
            },
            {
                chr: 'chr20',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 4
            },
            {
                chr: 'chr22',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 3
            },
            {
                chr: 'chrX',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 2
            },
            {
                chr: 'chrY',
                start: 100,
                end: 20000000,
                start2: 30000000,
                end2: 50000000,
                value: 1
            }
        ],
        type: 'json',
        chromosomeField: 'chr',
        genomicFields: ['start', 'end', 'start2', 'end2']
    },
    x: { field: 'start', type: 'genomic', axis: 'none' },
    y: { field: 'value', type: 'quantitative', axis: 'none' },
    width: 600,
    height: 50,
    assembly: 'hg38',
    tracks: [
        { mark: 'point' },
        { mark: 'line' },
        { mark: 'area' },
        { mark: 'bar' },
        { mark: 'triangleLeft' },
        { mark: 'triangleRight' },
        { mark: 'triangleBottom' },
        { mark: 'rect', xe: { field: 'end', type: 'genomic' } },
        { mark: 'text', text: { field: 'value', type: 'quantitative' } },
        { mark: 'withinLink', xe: { field: 'end2', type: 'genomic' } },
        {
            mark: 'betweenLink',
            xe: { field: 'end', type: 'genomic' },
            x1: { field: 'start2', type: 'genomic' },
            x1e: { field: 'end2', type: 'genomic' }
        },
        { mark: 'rule' }
    ]
} as GoslingSpec;

test('marks', async ({ mount, page }, testInfo) => {
    const component = await mount(<GoslingComponent spec={spec} />);
    await page.waitForTimeout(1000);
    expect(await component.screenshot()).toMatchSnapshot();
    // const screenshot = await component.screenshot();
    // await testInfo.attach('gosComponentScreenshot', {
    //     body: screenshot,
    //     contentType: 'image/png'
    // });
});
