export type ICON_INFO = {
    width: number;
    height: number;
    viewBox: string;
    path: string[];
    stroke: string;
    fill: string;
};

export const ICONS: { [k: string]: ICON_INFO } = {
    DOCS: {
        width: 20,
        height: 20,
        viewBox: '0 0 16 16',
        path: [
            'M8.646 5.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L10.293 8 8.646 6.354a.5.5 0 0 1 0-.708zm-1.292 0a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0 0 .708l2 2a.5.5 0 0 0 .708-.708L5.707 8l1.647-1.646a.5.5 0 0 0 0-.708z',
            'M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z',
            'M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z'
        ],
        stroke: 'none',
        fill: 'currentColor'
    },
    GITHUB: {
        width: 20,
        height: 20,
        viewBox: '0 0 16 16',
        path: [
            'M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z'
        ],
        stroke: 'none',
        fill: 'currentColor'
    },
    FIND: {
        width: 20,
        height: 20,
        viewBox: '0 0 16 16',
        path: [
            'M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'
        ],
        stroke: 'none',
        fill: 'currentColor'
    },
    SPLIT: {
        width: 20,
        height: 20,
        viewBox: '0 0 16 16',
        path: [
            'M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3zm5-1v12h9a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H5zM4 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2V2z'
        ],
        stroke: 'none',
        fill: 'currentColor'
    },
    TOGGLE_ON: {
        width: 22,
        height: 22,
        viewBox: '0 0 2048 1792',
        path: [
            'M0 896q0-130 51-248.5t136.5-204 204-136.5 248.5-51h768q130 0 248.5 51t204 136.5 136.5 204 51 248.5-51 248.5-136.5 204-204 136.5-248.5 51h-768q-130 0-248.5-51t-204-136.5-136.5-204-51-248.5zm1408 512q104 0 198.5-40.5t163.5-109.5 109.5-163.5 40.5-198.5-40.5-198.5-109.5-163.5-163.5-109.5-198.5-40.5-198.5 40.5-163.5 109.5-109.5 163.5-40.5 198.5 40.5 198.5 109.5 163.5 163.5 109.5 198.5 40.5z'
        ],
        stroke: 'none',
        fill: 'currentColor'
    },
    TOGGLE_OFF: {
        width: 22,
        height: 22,
        viewBox: '0 0 2048 1792',
        path: [
            'M1152 896q0-104-40.5-198.5t-109.5-163.5-163.5-109.5-198.5-40.5-198.5 40.5-163.5 109.5-109.5 163.5-40.5 198.5 40.5 198.5 109.5 163.5 163.5 109.5 198.5 40.5 198.5-40.5 163.5-109.5 109.5-163.5 40.5-198.5zm768 0q0-104-40.5-198.5t-109.5-163.5-163.5-109.5-198.5-40.5h-386q119 90 188.5 224t69.5 288-69.5 288-188.5 224h386q104 0 198.5-40.5t163.5-109.5 109.5-163.5 40.5-198.5zm128 0q0 130-51 248.5t-136.5 204-204 136.5-248.5 51h-768q-130 0-248.5-51t-204-136.5-136.5-204-51-248.5 51-248.5 136.5-204 204-136.5 248.5-51h768q130 0 248.5 51t204 136.5 136.5 204 51 248.5z'
        ],
        stroke: 'none',
        fill: 'currentColor'
    },
    PLAY: {
        width: 18,
        height: 18,
        viewBox: '0 0 24 24',
        path: ['M7 4v16l13 -8z'],
        stroke: 'none',
        fill: 'currentColor'
    },
    LINK: {
        width: 18,
        height: 18,
        viewBox: '0 0 24 24',
        path: [
            'M10 14a3.5 3.5 0 0 0 5 0l4 -4a3.5 3.5 0 0 0 -5 -5l-.5 .5',
            'M14 10a3.5 3.5 0 0 0 -5 0l-4 4a3.5 3.5 0 0 0 5 5l.5 -.5'
        ],
        stroke: 'currentColor',
        fill: 'none'
    },
    MAXIMIZE: {
        width: 18,
        height: 18,
        viewBox: '0 0 24 24',
        path: [
            'M5 9h2a2 2 0 0 0 2 -2v-2',
            'M15 19v-2a2 2 0 0 1 2 -2h2',
            'M15 5v2a2 2 0 0 0 2 2h2',
            'M5 15h2a2 2 0 0 1 2 2v2'
        ],
        stroke: 'currentColor',
        fill: 'none'
    },
    MINIMIZE: {
        width: 18,
        height: 18,
        viewBox: '0 0 24 24',
        path: [
            'M4 8v-2a2 2 0 0 1 2 -2h2',
            'M4 16v2a2 2 0 0 0 2 2h2',
            'M16 4h2a2 2 0 0 1 2 2v2',
            'M16 20h2a2 2 0 0 0 2 -2v-2'
        ],
        stroke: 'currentColor',
        fill: 'none'
    }
};
