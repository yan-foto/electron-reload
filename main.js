var app = require('app');
var chokidar = require('chokidar');
var extend = require('util')._extend;
var fs = require('fs');

var bootstrap = function(glob, options) {
  var browserWindows = [];
  var opts = extend({ignored: /node_modules|[\/\\]\./}, options);
  var watcher = chokidar.watch(glob, opts);

  var onChange = function() {
    browserWindows.forEach(function(bw) {
      bw.webContents.reloadIgnoringCache();
    });
  };

  // Due to this issue: https://github.com/atom/electron/issues/2455
  // I suppose this is our best chance to know when a BW is created
  app.on('browser-window-focus', function(e, bw) {
    var i = browserWindows.indexOf(bw);

    // A new browser window
    if(i === -1) {
      browserWindows.push(bw);

      // Remove reference when BrowserWindow is closed
      bw.on('closed', function() {
        browserWindows.splice(i, 1);
      });
    }
  });

  // Preparing hard reset
  var eXecutable = options.electron;
  if(eXecutable && fs.existsSync(eXecutable)) {
    var proc = require('child_process');
    var path = require('path');

    var appPath = app.getAppPath();

    var config = require(path.join(appPath, 'package.json'));
    var mainFile = path.join(appPath, config.main);

    chokidar.watch(mainFile).on('change', function() {
      proc.spawn(eXecutable, [appPath]);
      // Kamikaze!
      app.quit();
    });
  } else {
    console.log('Electron could not be found. No hard resets for you!');
  }

  watcher.on('change', onChange);
};

module.exports = bootstrap;
