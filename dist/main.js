"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var child_process_1 = require("child_process");
var electron_1 = require("electron");
var chokidar_1 = require("chokidar");
var appPath = electron_1.app.getAppPath();
var ignoredPaths = /node_modules|[/\\]\./;
// Main file poses a special case, as its changes are
// only effective when the process is restarted (hard reset)
// We assume that electron-reload is required by the main
// file of the electron application
// const mainFile = module.parent.filename;
/**
 * Creates a callback for hard resets.
 *
 * @param {String} eXecutable path to electron executable
 * @param {String} hardResetMethod method to restart electron
 */
var createHardresetHandler = function (eXecutable, hardResetMethod, argv) { return function () {
    // Detaching child is useful when in Windows to let child
    // live after the parent is killed
    var args = (argv !== null && argv !== void 0 ? argv : []).concat([appPath]);
    var child = child_process_1.spawn(eXecutable, args, {
        detached: true,
        stdio: 'inherit'
    });
    child.unref();
    // Kamikaze!
    // In cases where an app overrides the default closing or quiting actions
    // firing an `app.quit()` may not actually quit the app. In these cases
    // you can use `app.exit()` to gracefully close the app.
    if (hardResetMethod === 'exit') {
        electron_1.app.exit();
    }
    else {
        electron_1.app.quit();
    }
}; };
exports.default = (function (glob, options) {
    if (options === void 0) { options = {}; }
    var _a, _b, _c;
    var mainFile = (_c = (_a = options.mainFile) !== null && _a !== void 0 ? _a : (_b = module.parent) === null || _b === void 0 ? void 0 : _b.filename) !== null && _c !== void 0 ? _c : '';
    var browserWindows = [];
    var watcher = chokidar_1.default.watch(glob, Object.assign({ ignored: [ignoredPaths, mainFile] }, options));
    // Callback function to be executed:
    // I) soft reset: reload browser windows
    var softResetHandler = function () {
        return browserWindows.forEach(function (bw) { return bw.webContents.reloadIgnoringCache(); });
    };
    // II) hard reset: restart the whole electron process
    var eXecutable = options.electron;
    var hardResetHandler = createHardresetHandler(eXecutable !== null && eXecutable !== void 0 ? eXecutable : '', options.hardResetMethod, options.argv);
    // Add each created BrowserWindow to list of maintained items
    electron_1.app.on('browser-window-created', function (_e, bw) {
        browserWindows.push(bw);
        // Remove closed windows from list of maintained items
        bw.on('closed', function () {
            var i = browserWindows.indexOf(bw); // Must use current index
            browserWindows.splice(i, 1);
        });
    });
    // Enable default soft reset
    watcher.on('change', softResetHandler);
    // Preparing hard reset if electron executable is given in options
    // A hard reset is only done when the main file has changed
    if (typeof eXecutable === 'string' && fs_1.default.existsSync(eXecutable)) {
        var hardWatcher = chokidar_1.default.watch(mainFile, Object.assign({ ignored: [ignoredPaths] }, options));
        if (options.forceHardReset === true) {
            // Watch every file for hard reset and not only the main file
            hardWatcher.add(glob);
            // Stop our default soft reset
            watcher.close();
        }
        hardWatcher.once('change', hardResetHandler);
    }
    else {
        console.log('Electron could not be found. No hard resets for you!');
    }
});
//# sourceMappingURL=main.js.map