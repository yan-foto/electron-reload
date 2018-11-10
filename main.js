const { app } = require('electron')
const chokidar = require('chokidar')
const fs = require('fs')
const { spawn } = require('child_process')
const path = require('path')

// Main file poses a special case, as its changes are
// only effective when the process is restarted (hard reset)
const appPath = app.getAppPath()
const config = require(path.join(appPath, 'package.json'))
const mainFile = path.join(appPath, config.main || 'index.js')
const ignoredPaths = [mainFile, /node_modules|[/\\]\./]

/**
 * Creates a callback for hard resets.
 *
 * @param {String} eXecutable path to electron executable
 * @param {String} hardResetMethod method to restart electron
 * @returns {Function} handler to pass to chokidar
 */
const createHardresetHandler = (eXecutable, hardResetMethod, argv) =>
  () => {
    // Detaching child is useful when in Windows to let child
    // live after the parent is killed
    let args = (argv || []).concat([appPath])
    let child = spawn(eXecutable, args, {
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
 * Creates main chokidar watcher for soft resets.
 *
 * @param {String|Array<String>} glob path, glob, or array to pass to chokidar
 * @param {Object} options chokidar options
 */
const createWatcher = (glob, options = {}) => {
  // Watch everything but the node_modules folder and main file
  // main file changes are only effective if hard reset is possible
  let opts = Object.assign({ ignored: ignoredPaths }, options)
  return chokidar.watch(glob, opts)
}

module.exports = (glob, options = {}) => {
  let browserWindows = []
  let watcher = createWatcher(glob, options)

  // Callback function to be executed when any of the files
  // defined in given 'glob' is changed.
  let onChange = () => browserWindows.forEach(bw => bw.webContents.reloadIgnoringCache())

  // Add each created BrowserWindow to list of maintained items
  app.on('browser-window-created', (e, bw) => {
    browserWindows.push(bw)

    // Remove closed windows from list of maintained items
    bw.on('closed', function () {
      let i = browserWindows.indexOf(bw) // Must use current index
      browserWindows.splice(i, 1)
    })
  })

  // Preparing hard reset if electron executable is given in options
  // A hard reset is only done when the main file has changed
  let eXecutable = options.electron
  if (eXecutable && fs.existsSync(eXecutable)) {
    chokidar.watch(mainFile).once('change', createHardresetHandler(eXecutable, options.hardResetMethod, options.argv))
  } else {
    console.log('Electron could not be found. No hard resets for you!')
  }

  watcher.on('change', onChange)
}
