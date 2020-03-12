declare function _exports(glob: string | string[], options?: {
    persistent?: boolean | undefined;
    ignored?: any;
    ignoreInitial?: boolean | undefined;
    followSymlinks?: boolean | undefined;
    cwd?: string | undefined;
    disableGlobbing?: boolean | undefined;
    usePolling?: boolean | undefined;
    useFsEvents?: boolean | undefined;
    alwaysStat?: boolean | undefined;
    depth?: number | undefined;
    interval?: number | undefined;
    binaryInterval?: number | undefined;
    ignorePermissionErrors?: boolean | undefined;
    atomic?: number | boolean | undefined;
    awaitWriteFinish?: any;
} | undefined): void;
export = _exports;
