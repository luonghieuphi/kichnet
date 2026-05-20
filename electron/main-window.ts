import { app, BrowserWindow, shell } from "electron";
import { getPlatform } from "./utils/get-device-specs";
import { join } from "path";
import { ELECTRON_COMMANDS } from "../common/electron-commands";
import { fetchLocalStorage } from "./utils/config-variables";
import electronIsDev from "electron-is-dev";
import { format } from "url";
import { autoUpdater } from "electron-updater";

let mainWindow: BrowserWindow | undefined;

const createMainWindow = () => {
  console.log("📂 DIRNAME", __dirname);
  console.log("🚃 App Path: ", app.getAppPath());

  const iconPath = getPlatform() === "linux"
    ? (electronIsDev
        ? join(app.getAppPath(), "renderer", "public", "sharpix_logo_icon.png")
        : join(app.getAppPath(), "renderer", "out", "sharpix_logo_icon.png"))
    : (electronIsDev
        ? join(app.getAppPath(), "renderer", "public", "icon.ico")
        : join(app.getAppPath(), "renderer", "out", "icon.ico"));

  mainWindow = new BrowserWindow({
    icon: iconPath,
    width: 1300,
    height: 940,
    minHeight: 500,
    minWidth: 600,
    show: false,
    backgroundColor: "#171717",
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webSecurity: false,
      preload: join(__dirname, "preload.js"),
    },
    titleBarStyle: getPlatform() === "mac" ? "hiddenInset" : "default",
  });

  const url = electronIsDev
    ? "http://localhost:8000"
    : format({
      pathname: join(__dirname, "../../renderer/out/index.html"),
      protocol: "file:",
      slashes: true,
    });

  mainWindow.loadURL(url);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.once("ready-to-show", () => {
    if (!mainWindow) return;
    mainWindow.show();
  });

  fetchLocalStorage();

  if (!electronIsDev) {
    mainWindow.webContents
      .executeJavaScript('localStorage.getItem("autoUpdate");', true)
      .then((autoUpdateVal: string | null) => {
        // Default to true if the setting doesn't exist yet, otherwise check if it is "true"
        const shouldUpdate = autoUpdateVal === null || autoUpdateVal === "true";
        if (shouldUpdate) {
          autoUpdater.checkForUpdatesAndNotify();
        }
      })
      .catch((err) => {
        console.error("Failed to check auto-update settings:", err);
        // Fallback to checking updates in case of error
        autoUpdater.checkForUpdatesAndNotify();
      });
  }

  mainWindow.webContents.send(ELECTRON_COMMANDS.OS, getPlatform());

  mainWindow.setMenuBarVisibility(false);
};

const getMainWindow = () => {
  return mainWindow;
};

export { createMainWindow, getMainWindow };
