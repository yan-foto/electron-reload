import { app, BrowserWindow } from "electron";
import * as chokidar from "chokidar";
import * as fs from "fs";
import { spawn } from "child_process";
import * as path from "path";

// Main file poses a special case, as its changes are
// only effective when the process is restarted (hard reset)
const appPath = app.getAppPath();
const config = require(path.join(appPath, "package.json"));
const mainFile = path.join(appPath, config.main || "index.js");
const ignoredPaths = [mainFile, /node_modules|[/\\]\./];

/**
 * Creates a callback for hard resets.
 *
 * @param eXecutable path to electron executable
 * @param hardResetMethod method to restart electron
 * @returns handler to pass to chokidar
 */
const createHardresetHandler = (eXecutable: string, hardResetMethod: string = ""): (() => void) => () => {
  // Detaching child is useful when in Windows to let child
  // live after the parent is killed
  let child = spawn(eXecutable, [appPath], {
    detached: true,
    stdio: "inherit",
  });
  child.unref();
  // Kamikaze!

  // In cases where an app overrides the default closing or quiting actions
  // firing an `app.quit()` may not actually quit the app. In these cases
  // you can use `app.exit()` to gracefully close the app.
  if (hardResetMethod === "exit") {
    app.exit();
  } else {
    app.quit();
  }
};

/**
 * Creates main chokidar watcher for soft resets.
 *
 * @param glob path, glob, or array to pass to chokidar
 * @param options chokidar options
 */
const createWatcher = (glob: string | string[], options: { electron?: string } = {}): chokidar.FSWatcher => {
  // Watch everything but the node_modules folder and main file
  // main file changes are only effective if hard reset is possible
  let opts = Object.assign({ ignored: ignoredPaths }, options);
  return chokidar.watch(glob, opts);
};

export default (glob: string | string[], options: { electron?: string; hardResetMethod?: string } = {}): void => {
  let browserWindows: BrowserWindow[] = [];
  let watcher = createWatcher(glob, options);

  // Callback function to be executed when any of the files
  // defined in given 'glob' is changed.
  let onChange = () => browserWindows.forEach(bw => bw.webContents.reloadIgnoringCache());

  // Add each created BrowserWindow to list of maintained items
  app.on("browser-window-created", (e, bw) => {
    browserWindows.push(bw);

    // Remove closed windows from list of maintained items
    bw.on("closed", function() {
      let i = browserWindows.indexOf(bw); // Must use current index
      browserWindows.splice(i, 1);
    });
  });

  // Preparing hard reset if electron executable is given in options
  // A hard reset is only done when the main file has changed
  let eXecutable = options.electron;
  if (eXecutable && fs.existsSync(eXecutable)) {
    chokidar.watch(mainFile).once("change", createHardresetHandler(eXecutable, options.hardResetMethod));
  } else {
    console.log("Electron could not be found. No hard resets for you!");
  }

  watcher.on("change", onChange);
};
