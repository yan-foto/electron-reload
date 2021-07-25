import { WatchOptions } from 'chokidar'

export interface ElectronReloadOptions extends WatchOptions {
    /**
     * Path to electron binary: this is used for hard resets, e.g.
     * in case of changes to the main file.
     */
    electron?: string,
    /**
     * Arguments passed to the electron binary (relevant for hard
     * resets).
     */
    electronArgv?: [string],
    /**
     * Arguments passed to the application (relevant for hard
     * resets).
     */
    appArgv?: [string]
    /**
     * Determines how to terminate electron in case of hard resets.
     * See 'https://www.electronjs.org/docs/api/app' for details.
     */
    hardResetMethod?: "exit" | "quit",
    /**
     * Enforces a hard reset for all changes (and not just the main
     * file).
     */
    forceHardReset?: boolean
}

export default function electronReload(glob: string, options: ElectronReloadOptions) : void;