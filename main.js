const {app} = require('electron');
const chokidar = require('chokidar');
const fs = require('fs');
const {spawn} = require('child_process');
const path = require('path');

module.exports = (mainDirname, options) => {
  options = options || {};
  let browserWindows = [];
  let opts = Object.assign({ignored: /node_modules|[\/\\]\./}, options);
  let watcher = chokidar.watch(mainDirname, opts);

  /**
   * Callback function to be executed when any of the files
   * defined in given 'glob' is changed.
   */
  let onChange = () => {
    browserWindows.forEach((bw) => {
      bw.webContents.reloadIgnoringCache();
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
  let eXecutable = options.electron;
  if(eXecutable && fs.existsSync(eXecutable)) {
    let appPath = app.getAppPath();

		// console.log('electron-reload: appPath:', appPath);
		// console.log('electron-reload: __dirname:', __dirname);

		// eslint-disable-line
    let config = require(path.join(appPath, 'package.json'));
    let mainFile = path.join(mainDirname, config.main);

		// console.log('electron-reload watching mainfile:',mainFile);

		if (fs.existsSync(mainFile)) {
			chokidar.watch(mainFile).on('change', () => {

			// console.log('electron-reload: mainFile onchange callback')

			// Detaching child is useful when in Windows to let child
			// live after the parent is killed
			let child = spawn(eXecutable, [mainDirname], {
				detached: true,
				stdio: 'inherit'
			});
			child.unref();
			// Kamikaze!

			// In cases where an app overrides the default closing or quiting actions
			// firing an `app.quit()` may not actually quit the app. In these cases
			// you can use `app.exit()` to gracefully close the app.
			if(opts.hardResetMethod === 'exit'){
					app.exit();
			} else {
					app.quit();
			}
		});
	} else {
		console.log('mainFile does not exist:',mainFile);
	};
} else {
    console.log('Electron could not be found. No hard resets for you!');
  }

  watcher.on('change', onChange);
};
