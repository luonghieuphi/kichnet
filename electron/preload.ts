import { ipcRenderer, contextBridge } from "electron";
import { execSync } from "child_process";
import os from "os";
import {
  getAppVersion,
  getDeviceSpecs,
  getPlatform,
} from "./utils/get-device-specs";

function getNativeMachineId(): string {
  try {
    const platform = os.platform();
    if (platform === "win32") {
      const output = execSync('reg query HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Cryptography /v MachineGuid', { encoding: 'utf8' });
      const match = output.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9-]+)/);
      if (match && match[1]) {
        return match[1].trim().toUpperCase();
      }
    } else if (platform === "darwin") {
      const output = execSync('ioreg -rd1 -c IOPlatformExpertDevice', { encoding: 'utf8' });
      const match = output.match(/"IOPlatformUUID"\s+=\s+"([^"]+)"/);
      if (match && match[1]) {
        return match[1].trim().toUpperCase();
      }
    } else {
      try {
        const id = execSync('cat /etc/machine-id || cat /var/lib/dbus/machine-id', { encoding: 'utf8' });
        if (id) return id.trim().toUpperCase();
      } catch (e) {}
    }
  } catch (err) {
    console.error("Failed to get native machine ID, falling back to os-based hash", err);
  }
  
  const fallbackString = `${os.hostname()}-${os.platform()}-${os.arch()}-${os.userInfo().username}`;
  let hash = 0;
  for (let i = 0; i < fallbackString.length; i++) {
    hash = (hash << 5) - hash + fallbackString.charCodeAt(i);
    hash |= 0;
  }
  return `FALLBACK-${Math.abs(hash).toString(16).toUpperCase()}`;
}

// 'ipcRenderer' will be available in index.js with the method 'window.electron'
contextBridge.exposeInMainWorld("electron", {
  send: (command: string, payload: any) => ipcRenderer.send(command, payload),
  on: (command: string, func: (...args: any) => any) =>
    ipcRenderer.on(command, (event, args) => {
      func(event, args);
    }),
  invoke: (command: string, payload: any) =>
    ipcRenderer.invoke(command, payload),
  platform: getPlatform(),
  getSystemInfo: async () => await getDeviceSpecs(),
  getAppVersion: async () => await getAppVersion(),
  getMachineId: () => getNativeMachineId(),
});
