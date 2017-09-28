const {app} = require('electron')
const chokidar = require('chokidar')
const fs = require('fs')
const {spawn} = require('child_process')
const path = require('path')

module.exports = (glob, options) => {
  options = options || {}
  let browserWindows = []

  // Main file poses a special case, as its changes are
  // only effective when the process is restarted (hard reset)
  let appPath = app.getAppPath()
  let config = require(path.join(appPath, 'package.json'))
  let mainFile = path.join(appPath, config.main)

  // Watch everything but the node_modules folder and main file
  // main file changes are only effective if hard reset is possible
  let opts = Object.assign({
    ignored:
    [
      mainFile,
      /node_modules|[/\\]\./
    ]}, options)
  let watcher = chokidar.watch(glob, opts)

  /**
   * Callback function to be executed when any of the files
   * defined in given 'glob' is changed.
   */
  let onChange = () => {
    browserWindows.forEach((bw) => {
      bw.webContents.reloadIgnoringCache()
    })
  }

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
    chokidar.watch(mainFile).on('change', () => {
      // Detaching child is useful when in Windows to let child
      // live after the parent is killed
      let child = spawn(eXecutable, [appPath], {
        detached: true,
        stdio: 'inherit'
      })
      child.unref()
      // Kamikaze!

      // In cases where an app overrides the default closing or quiting actions
      // firing an `app.quit()` may not actually quit the app. In these cases
      // you can use `app.exit()` to gracefully close the app.
      if (opts.hardResetMethod === 'exit') {
        app.exit()
      } else {
        app.quit()
      }
    })
  } else {
    console.log('Electron could not be found. No hard resets for you!')
  }

  watcher.on('change', onChange)
}
