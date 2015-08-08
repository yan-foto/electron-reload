# electron reload
This is (*hopefully :pray:*) the simplest way to load contents of all active [`BrowserWindow`s](https://github.com/atom/electron/blob/master/docs/api/browser-window.md) within electron when the source files are changed.

<a href="https://github.com/yan-foto/neutron"><img alt="Neutron Compatible" src="https://img.shields.io/badge/neutron-compatible-004455.svg"></a>

**Disclaimer**: this module is in its very early stages and the logic is still not mature enough.

# Installation
```
npm install electron-reload
```

# Usage
Just initialize this module with desired glob or file path to watch and let it refresh electron browser windows as targets are changed:

```js
'use strict';

var app = require('app');
var BrowserWindow = require('browser-window');

require('electron-reload')(__dirname);

// Standard stuff

app.on('ready', function () {
  mainWindow = new BrowserWindow({ width: 800, height: 600 });

  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  // the rest...
});
```

# API
`electron_reload(paths, options)`
* `paths`: a file, directory or glob pattern to watch
* `options` (optional): [`chokidar`](https://github.com/paulmillr/chokidar) options. (default: `{ignored: /[\/\\]\./}`)


# Why this module?
Simply put, I was tired and confused by all other available modules which are so complicated\* for such an uncomplicated task!

\* *e.g. start a local HTTP server, publish change events through a WebSocket, etc.!*

# Even more!
If you want to have least effort when developing electron packages, take a look at [neutron](https://github.com/yan-foto/neutron)!
