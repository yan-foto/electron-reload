var app = require('app');
var chokidar = require('chokidar');
var extend = require('util')._extend;
var fs = require('fs');

var bootstrap = function(glob, options) {
  options = options || {};
  var browserWindows = [];
  var opts = extend({ignored: /node_modules|[\/\\]\./}, options);
  var watcher = chokidar.watch(glob, opts);

  var onChange = function() {
    browserWindows.forEach(function(bw) {
      bw.webContents.reloadIgnoringCache();
    });
  };

  app.on('browser-window-created', function(e, bw) {
    browserWindows.push(bw);
    var i = browserWindows.indexOf(bw);

    bw.on('closed', function() {
      browserWindows.splice(i, 1);
    });
  })

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
