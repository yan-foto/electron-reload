declare function _exports(glob: string | string[], options?: Partial<import("chokidar").WatchOptions & ExtraOptions> | undefined): void;
export = _exports;
export type ExtraOptions = {
    hardResetMethod?: string;
    argv?: string[];
    forceHardReset?: boolean;
    electron?: string;
    mainFile?: string;
};
