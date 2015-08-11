var app = require('app');
var chokidar = require('chokidar');

module.exports = function(glob, options) {
  var browserWindows = [];
  var opts = options || {ignored: /node_modules|[\/\\]\./};

  var onChange = function() {
    browserWindows.forEach(function(bw) {
      bw.webContents.reloadIgnoringCache();
    });
  };

  var watcher = chokidar.watch(glob, opts);

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

  watcher.on('change', onChange);
};
