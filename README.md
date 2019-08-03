# electron reload
This is (*hopefully*) the simplest way to load contents of all active [`BrowserWindow`s](https://github.com/atom/electron/blob/master/docs/api/browser-window.md) within electron when the source files are changed.

[![Build Status](https://travis-ci.org/yan-foto/electron-reload.svg?branch=master)](https://travis-ci.org/yan-foto/electron-reload)
[![neutron](https://img.shields.io/badge/neutron-compatible-004455.svg)](https://github.com/yan-foto/neutron)
[![npm](https://img.shields.io/npm/v/electron-reload.svg)](https://www.npmjs.com/package/electron-reload)
[![Code Climate](https://codeclimate.com/github/yan-foto/electron-reload/badges/gpa.svg)](https://codeclimate.com/github/yan-foto/electron-reload)
[![Known Vulnerabilities](https://snyk.io/test/github/yan-foto/electron-reload/badge.svg)](https://snyk.io/test/github/yan-foto/electron-reload)
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

const {app, BrowserWindow} = require('electron');

require('electron-reload')(__dirname);

// Standard stuff
app.on('ready', () {
  let mainWindow = new BrowserWindow({width: 800, height: 600});

  mainWindow.loadUrl(`file://${__dirname}/index.html`);
  // the rest...
});
```

Note that the above code only refreshes `WebContent`s of all `BrowserWindow`s. So if you want to have a hard reset (starting a new electron process) you can just pass the path to the electron executable in the `options` object. For example if you already have electron pre-built installed you could just do

```js
require('electron-reload')(__dirname, {
  electron: require('electron-prebuilt')
});
```

You could also use the (relatively) new [`electron`](https://www.npmjs.com/package/electron) package, *but* you should specify the path directly (no `require`!):

```js
const path = require('path')

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron')
});
```

If your app overrides some of the default `quit` or `close` actions (e.g. closing the last app window hides the window instead of quitting the app) then the default `electron-reload` hard restart could leave you with multiple instances of your app running. In these cases you can change the default hard restart action from `app.quit()` to `app.exit()` by specifying the hard reset method in the electron-reload options:

```js
const path = require('path')

require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
  hardResetMethod: 'exit'
});
```

# API
`electron_reload(paths, options)`
* `paths`: a file, directory or glob pattern to watch
* `options` (optional) containing:
  - [`chokidar`](https://github.com/paulmillr/chokidar) options
  - `electron` property pointing to electron executables.
  - `argv` string array with command line options passed to the executed Electron app. Only used when hard resetting.
  - `forceHardReset`: enables hard reset for **every** file change and not only the main file

  `options` will default to `{ignored: /node_modules|[\/\\]\./, argv: []}`.


# Why this module?
Simply put, I was tired and confused by all other available modules which are so complicated\* for such an uncomplicated task!

\* *e.g. start a local HTTP server, publish change events through a WebSocket, etc.!*

# Even more!
If you want to have least effort when developing electron packages, take a look at [neutron](https://github.com/yan-foto/neutron)!

# Changelog
 - **1.5.0**:
   - Upgrade `chokidar` from v2 to v3 (lighter/faster installation)
   - Add friendly linting in dev mode (`node run lint`) and fix CI linting issues (see [#62](https://github.com/yan-foto/electron-reload/pull/62))
 - **1.4.1**: Fix two minor bugs
   - Wrong globbing when doing hard reset ([`#58`](https://github.com/yan-foto/electron-reload/issues/58))
   - Issues with locating main file in specific project structures ([`#57`](https://github.com/yan-foto/electron-reload/issues/57))
 - **1.4.0**: Enable hard reset for all changes (and not only the main file)
 - **1.3.0**: Allow passing arguments to electron executable upon hard resets
 - **1.2.5**: Upgrade dependencies (fix vulnerabilities)
 - **1.2.4**: Use `index.js` as fallback if `main` is not defined in `package.json`
 - **1.2.3**: Fix multiple instances on restart
 - **1.2.2**: Fix `browserWindows[]` indexing
 - **1.2.1**: Remove logging from production code (d'oh)
 - **1.2.0**: Allow hard reset in multiple browser windows
 - **1.1.0**: Add `app.exit()` in addition to `app.quit()` for hard resets
 - **1.0.3**: Fix hard reset bug
 - **1.0.2**: Detach child so that killing parent doesn't kill it (on windows)
 - **1.0.1**: Replace `extend` with `Object.assign`
 - **1.0.0**: Adapt to Electron 1.0 new API
 - **0.3.0**: Use new method of accessing `app` (e.g. `require(electron).app`)
 - **0.2.0**: Use new electrons (> v0.32.3) `browser-window-created` event
