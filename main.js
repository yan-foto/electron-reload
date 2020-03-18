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
 * @param {string[]} hardResetMethod method to restart electron
 * @returns {Function} handler to pass to chokidar
 */
const createHardresetHandler = (eXecutable, hardResetMethod, argv) => () => {
  // Detaching child is useful when in Windows to let child
  // live after the parent is killed
  const args = [appPath].concat(argv || [])
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
 * @typedef {Object} ExtraOptions
 * @property {string} [hardResetMethod]
 * @property {string[]} [argv]
 * @property {boolean} [forceHardReset]
 * @property {string} [electron]
 * @property {string} [mainFile]
 */

/**
 * @param {string | string[]} glob
 * @param { Partial<chokidar.WatchOptions & ExtraOptions> } [options]
 * @returns {void}
 */
module.exports = (glob, options = {}) => {
  // Main file poses a special case, as its changes are
  // only effective when the process is restarted (hard reset)
  // We assume that electron-reload is required by the main
  // file of the electron application if a path is not provided
  const mainFile =
    options.mainFile || module.parent ? module.parent.filename || '' : ''
  const browserWindows = []
  const watcher = chokidar.watch(
    glob,
    Object.assign({ ignored: [ignoredPaths, mainFile] }, options)
  )

  // Callback function to be executed:
  // I) soft reset: reload browser windows
  const softResetHandler = () =>
    browserWindows.forEach(bw => bw.webContents.reloadIgnoringCache())
  // II) hard reset: restart the whole electron process
  const eXecutable = options.electron
  const hardResetHandler = createHardresetHandler(
    eXecutable || '',
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
