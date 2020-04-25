const { app } = require('electron')
const chokidar = require('chokidar')
const fs = require('fs')
const { spawn } = require('child_process')

const appPath = app.getAppPath()
const ignoredPaths = /node_modules|[/\\]\./

/**
 * Creates a callback for hard resets.
 *
 * @param {string} eXecutable path to electron executable
 * @param {string} hardResetMethod method to restart electron
 * @param {string[]} argv arguments to restart electron with
 * @returns {Function} handler to pass to chokidar
 */
const createHardresetHandler = (eXecutable, hardResetMethod, argv) => () => {
  // Detaching child is useful when in Windows to let child
  // live after the parent is killed
  const args = [appPath].concat(argv)
  const child = spawn(eXecutable, args, {
    detached: true,
    stdio: 'inherit'
  })
  child.unref()
  // Kamikaze!

  // In cases where an app overrides the default closing or quiting actions
  // firing an `app.quit()` may not actually quit the app. In these cases
  // you can use `app.exit()` to gracefully close the app.
  if (hardResetMethod === 'exit') {
    app.exit()
  } else {
    app.quit()
  }
}

/**
 * @param {string | string[]} glob
 * @param {Options} options
 * @returns {void}
 */
module.exports = (
  glob,
  options = {
    alwaysStat: undefined,
    argv: [],
    atomic: undefined,
    awaitWriteFinish: undefined,
    binaryInterval: undefined,
    cwd: undefined,
    depth: undefined,
    disableGlobbing: undefined,
    electron: '',
    followSymlinks: undefined,
    forceHardReset: undefined,
    hardResetMethod: undefined,
    ignoreInitial: undefined,
    ignorePermissionErrors: undefined,
    ignored: undefined,
    interval: undefined,
    mainFile: module.parent.filename,
    persistent: undefined,
    useFsEvents: undefined,
    usePolling: undefined
  }
) => {
  // Main file poses a special case, as its changes are
  // only effective when the process is restarted (hard reset)
  // We assume that electron-reload is required by the main
  // file of the electron application if a path is not provided
  const mainFile = options.mainFile
  const browserWindows = []
  const watcher = chokidar.watch(
    glob,
    Object.assign({ ignored: [ignoredPaths, mainFile] }, options)
  )

  // Callback function to be executed:
  // I) soft reset: reload browser windows
  const softResetHandler = () =>
    browserWindows.forEach((bw) => bw.webContents.reloadIgnoringCache())
  // II) hard reset: restart the whole electron process
  const eXecutable = options.electron
  const hardResetHandler = createHardresetHandler(
    eXecutable,
    options.hardResetMethod,
    options.argv
  )

  // Add each created BrowserWindow to list of maintained items
  app.on('browser-window-created', (_e, bw) => {
    browserWindows.push(bw)

    // Remove closed windows from list of maintained items
    bw.on('closed', function () {
      const i = browserWindows.indexOf(bw) // Must use current index
      browserWindows.splice(i, 1)
    })
  })

  // Enable default soft reset
  watcher.on('change', softResetHandler)

  // Preparing hard reset if electron executable is given in options
  // A hard reset is only done when the main file has changed
  if (typeof eXecutable === 'string' && fs.existsSync(eXecutable)) {
    const hardWatcher = chokidar.watch(
      mainFile,
      Object.assign({ ignored: [ignoredPaths] }, options)
    )

    if (options.forceHardReset === true) {
      // Watch every file for hard reset and not only the main file
      hardWatcher.add(glob)
      // Stop our default soft reset
      watcher.close()
    }

    hardWatcher.once('change', hardResetHandler)
  } else {
    console.log('Electron could not be found. No hard resets for you!')
  }
}

/**
 * @typedef Options
 * @property {string} [hardResetMethod]
 * @property {string[]} [argv]
 * @property {boolean} [forceHardReset]
 * @property {string} electron
 * @property {string} [mainFile]
 * @property {boolean} [persistent] Indicates whether the process should continue to run as long as files are being watched. If set to `false` when using `fsevents` to watch, no more events will be emitted after `ready`, even if the process continues to run.
 * @property {*} [ignored] ([anymatch](https://github.com/es128/anymatch)-compatible definition) Defines files/paths to be ignored. The whole relative or absolute path is tested, not just filename. If a function with two arguments is provided, it gets called twice per path - once with a single argument (the path), second time with two arguments (the path and the [`fs.Stats`](http://nodejs.org/api/fs.html#fs_class_fs_stats) object of that path).
 * @property {boolean} [ignoreInitial] If set to `false` then `add`/`addDir` events are also emitted for matching paths while instantiating the watching as chokidar discovers these file paths (before the `ready` event).
 * @property {boolean} [followSymlinks] When `false`, only the symlinks themselves will be watched for changes instead of following the link references and bubbling events through the link's path.
 * @property {string} [cwd] The base directory from which watch `paths` are to be derived. Paths emitted with events will be relative to this.
 * @property {boolean} [disableGlobbing] If set to true then the strings passed to .watch() and .add() are treated as literal path names, even if they look like globs. Default: false.
 * @property {boolean} [usePolling] Whether to use fs.watchFile (backed by polling), or fs.watch. If polling leads to high CPU utilization, consider setting this to `false`. It is typically necessary to **set this to `true` to successfully watch files over a network**, and it may be necessary to successfully watch files in other non-standard situations. Setting to `true` explicitly on OS X overrides the `useFsEvents` default.
 * @property {boolean} [useFsEvents] Whether to use the `fsevents` watching interface if available. When set to `true` explicitly and `fsevents` is available this supercedes the `usePolling` setting. When set to `false` on OS X, `usePolling: true` becomes the default.
 * @property {boolean} [alwaysStat] If relying upon the [`fs.Stats`](http://nodejs.org/api/fs.html#fs_class_fs_stats) object that may get passed with `add`, `addDir`, and `change` events, set this to `true` to ensure it is provided even in cases where it wasn't already available from the underlying watch events.
 * @property {number} [depth] If set, limits how many levels of subdirectories will be traversed.
 * @property {number} [interval] Interval of file system polling.
 * @property {number} [binaryInterval] Interval of file system polling for binary files. ([see list of binary extensions](https://github.com/sindresorhus/binary-extensions/blob/master/binary-extensions.json))
 * @property {boolean} [ignorePermissionErrors] Indicates whether to watch files that don't have read permissions if possible. If watching fails due to `EPERM` or `EACCES` with this set to `true`, the errors will be suppressed silently.
 * @property {boolean | number} [atomic] `true` if `useFsEvents` and `usePolling` are `false`). Automatically filters out artifacts that occur when using editors that use "atomic writes" instead of writing directly to the source file. If a file is re-added within 100 ms of being deleted, Chokidar emits a `change` event rather than `unlink` then `add`. If the default of 100 ms does not work well for you, you can override it by setting `atomic` to a custom value, in milliseconds.
 * @property {AwaitWriteFinishOptions | boolean} [awaitWriteFinish] can be set to an object in order to adjust timing params:
 */

/**
 * @typedef AwaitWriteFinishOptions
 * @property {number} [stabilityThreshold] Amount of time in milliseconds for a file size to remain constant before emitting its event.
 * @property {number} [pollInterval] File size polling interval.
 */
