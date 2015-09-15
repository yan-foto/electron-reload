# electron reload
This is (*hopefully*) the simplest way to load contents of all active [`BrowserWindow`s](https://github.com/atom/electron/blob/master/docs/api/browser-window.md) within electron when the source files are changed.

<a href="https://github.com/yan-foto/neutron"><img alt="Neutron Compatible" src="https://img.shields.io/badge/neutron-compatible-004455.svg"></a>
<a href="https://www.npmjs.com/package/electron-reload"><img alt="NPM Version" src="https://img.shields.io/npm/v/electron-reload.svg"></a>
![license](https://img.shields.io/npm/l/electron-reload.svg)

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
  var mainWindow = new BrowserWindow({ width: 800, height: 600 });

  mainWindow.loadUrl('file://' + __dirname + '/index.html');
  // the rest...
});
```

Not that the above code only refreshes `WebContent`s of all `BrowserWindow`s. So if you want to have a hard reset (starting a new electron process) you can just pass the path to the electron executable in the `options` object. For example if you already have electron pre-built installed you could just do

```js
require('electron-reload')(__dirname, {
  electron: require('electron-prebuilt')
});
```

# API
`electron_reload(paths, options)`
* `paths`: a file, directory or glob pattern to watch
* `options` (optional): [`chokidar`](https://github.com/paulmillr/chokidar) options plus `electron` property pointing to electron executables. (default: `{ignored: /node_modules|[\/\\]\./}`)


# Why this module?
Simply put, I was tired and confused by all other available modules which are so complicated\* for such an uncomplicated task!

\* *e.g. start a local HTTP server, publish change events through a WebSocket, etc.!*

# Even more!
If you want to have least effort when developing electron packages, take a look at [neutron](https://github.com/yan-foto/neutron)!

# Changelog

 - **0.2.0**: Use new electrons (> v0.32.3) `browser-window-created` event
