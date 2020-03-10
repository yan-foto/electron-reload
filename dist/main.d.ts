import chokidar from 'chokidar';
declare const _default: (glob: string | string[], options?: Partial<chokidar.WatchOptions & {
    hardResetMethod?: string | undefined;
    argv?: string[] | undefined;
    forceHardReset?: boolean | undefined;
    electron?: string | undefined;
    mainFile?: string | undefined;
}>) => void;
export default _default;
