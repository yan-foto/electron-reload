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
const createHardresetHandler = (eXecutable: string, hardResetMethod: string, argv?: any): (() => void) => () => {
  // Detaching child is useful when in Windows to let child
  // live after the parent is killed
  const args = (argv || []).concat([appPath]);
  const child = spawn(eXecutable, args, {
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

export default (glob: string | string[], options: { electron: string; hardResetMethod: string; forceHardReset?: boolean; argv?: any }): void => {
  let browserWindows: BrowserWindow[] = [];
  const watcher = chokidar.watch(glob, Object.assign({ ignored: [ignoredPaths, mainFile] }, options));

  // Callback function to be executed:
  // I) soft reset: reload browser windows
  const softResetHandler = () => browserWindows.forEach(bw => bw.webContents.reloadIgnoringCache());
  // II) hard reset: restart the whole electron process
  const eXecutable = options.electron;
  const hardResetHandler = createHardresetHandler(eXecutable, options.hardResetMethod, options.argv);

  // Enable default soft reset
  watcher.on("change", softResetHandler);

  // Preparing hard reset if electron executable is given in options
  // A hard reset is only done when the main file has changed
  if (eXecutable && fs.existsSync(eXecutable)) {
    const hardWatcher = chokidar.watch(mainFile, Object.assign({ ignored: [ignoredPaths] }, options));

    if (options.forceHardReset === true) {
      // Watch every file for hard reset and not only the main file
      hardWatcher.add(glob);
      // Stop our default soft reset
      watcher.close();
    }

    hardWatcher.once("change", hardResetHandler);
  } else {
    console.log("Electron could not be found. No hard resets for you!");
  }
};
