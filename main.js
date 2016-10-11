const {app} = require('electron');
const chokidar = require('chokidar');
const fs = require('fs');
const {spawn} = require('child_process');
const path = require('path');

module.exports = (glob, options) => {
  options = options || {};

  let eXecutable = options.electron;
  delete options.electron;

  let singleURL = options.singleURL;
  delete options.singleURL;

  let browserWindows = [];
  let chokidarOptions = Object.assign({ignored: /node_modules|[\/\\]\./}, options);
  let watcher = chokidar.watch(glob, chokidarOptions);

  /**
   * Callback function to be executed when any of the files
   * defined in given 'glob' is changed.
   */
  let onChange = () => {
    browserWindows.forEach((bw) => {
      if(singleURL){
        bw.loadURL(singleURL);
      } else {
        bw.webContents.reloadIgnoringCache();
      }
    });
  };

  // Add each created BrowserWindow to list of maintained items
  app.on('browser-window-created', (e, bw) => {
    browserWindows.push(bw);
    let i = browserWindows.indexOf(bw);

    // Remove closed windows from list of maintained items
    bw.on('closed', function() {
      browserWindows.splice(i, 1);
    });
  });

  // Preparing hard reset if electron executable is given in options
  // A hard reset is only done when the main file has changed
  if(eXecutable && fs.existsSync(eXecutable)) {
    let appPath = app.getAppPath();
    // eslint-disable-line
    let config = require(path.join(appPath, 'package.json'));
    let mainFile = path.join(appPath, config.main);

    chokidar.watch(mainFile).on('change', () => {
      // Detaching child is useful when in Windows to let child
      // live after the parent is killed
      let child = proc.spawn(eXecutable, [appPath], {
        detached: true,
        stdio: 'inherit'
      });
      child.unref();
      // Kamikaze!
      app.quit();
    });
  } else {
    console.log('Electron could not be found. No hard resets for you!');
  }

  watcher.on('change', onChange);
};
