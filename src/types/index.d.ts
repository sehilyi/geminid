declare module 'js-asset:*' {
    const content: string;
    export default content;
}

declare module '*?worker' {
    const workerConstructor: {
        new (): Worker;
    };
    export default workerConstructor;
}
