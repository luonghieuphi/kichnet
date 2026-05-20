import prepareNext from "electron-next";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import { app, ipcMain, protocol } from "electron";
import { ELECTRON_COMMANDS } from "../common/electron-commands";
import logit from "./utils/logit";
import openFolder from "./commands/open-folder";
import stop from "./commands/stop";
import selectFolder from "./commands/select-folder";
import selectFile from "./commands/select-file";
import getModelsList from "./commands/get-models-list";
import customModelsSelect from "./commands/custom-models-select";
import imageUpscayl from "./commands/image-upscayl";
import { createMainWindow } from "./main-window";
import electronIsDev from "electron-is-dev";
import { execPath, modelsPath } from "./utils/get-resource-paths";
import batchUpscayl from "./commands/batch-upscayl";
import doubleUpscayl from "./commands/double-upscayl";
import autoUpdate from "./commands/auto-update";
import { FEATURE_FLAGS } from "../common/feature-flags";
import settings from "electron-settings";
import pasteImage from "./commands/paste-image";
import path from "path";
import fs from "fs";
import os from "os";
import { nativeImage, clipboard, BrowserWindow, shell } from "electron";
import { getMainWindow } from "./main-window";

// INITIALIZATION
log.initialize({ preload: true });

app.on("ready", async () => {
  await prepareNext("./renderer");

  app.whenReady().then(() => {
    protocol.registerFileProtocol("file", (request, callback) => {
      const pathname = decodeURI(request.url.replace("file:///", ""));
      callback(pathname);
    });
    protocol.registerFileProtocol("public", (request, callback) => {
      const filePath = decodeURI(request.url.replace("public:///", ""));
      const asarPath = path.join(
        app.getAppPath(),
        "renderer",
        process.env.NODE_ENV === "development" ? "public" : "out",
        filePath,
      );
      callback(asarPath);
    });
    logit("🚃 App Path: ", app.getAppPath());
  });

  createMainWindow();

  log.info(
    "🆙 Upscayl version:",
    app.getVersion(),
    FEATURE_FLAGS.APP_STORE_BUILD ? "MAC-APP-STORE" : "FOSS",
  );
  log.info("🚀 UPSCAYL EXEC PATH: ", execPath);
  log.info("🚀 MODELS PATH: ", modelsPath);

  let closeAccess;
  const folderBookmarks = await settings.get("folder-bookmarks");
  if (FEATURE_FLAGS.APP_STORE_BUILD && folderBookmarks) {
    logit("🚨 Folder Bookmarks: ", folderBookmarks);
    try {
      closeAccess = app.startAccessingSecurityScopedResource(
        folderBookmarks as string,
      );
    } catch (error) {
      logit("📁 Folder Bookmarks Error: ", error);
    }
  }
});

// Quit the app once all windows are closed
app.on("window-all-closed", () => {
  app.quit();
});

// ! ENABLE THIS FOR MACOS APP STORE BUILD
if (FEATURE_FLAGS.APP_STORE_BUILD) {
  logit("🚀 APP STORE BUILD ENABLED");
  app.commandLine.appendSwitch("in-process-gpu");
}

ipcMain.on(ELECTRON_COMMANDS.STOP, stop);

ipcMain.on(ELECTRON_COMMANDS.OPEN_FOLDER, openFolder);

ipcMain.handle(ELECTRON_COMMANDS.SELECT_FOLDER, selectFolder);

ipcMain.handle(ELECTRON_COMMANDS.SELECT_FILE, selectFile);

ipcMain.on(ELECTRON_COMMANDS.GET_MODELS_LIST, getModelsList);

ipcMain.handle(
  ELECTRON_COMMANDS.SELECT_CUSTOM_MODEL_FOLDER,
  customModelsSelect,
);

ipcMain.on(ELECTRON_COMMANDS.UPSCAYL, imageUpscayl);

ipcMain.on(ELECTRON_COMMANDS.FOLDER_UPSCAYL, batchUpscayl);

ipcMain.on(ELECTRON_COMMANDS.DOUBLE_UPSCAYL, doubleUpscayl);

ipcMain.on(ELECTRON_COMMANDS.PASTE_IMAGE, pasteImage);

ipcMain.handle("get-gpu-info", async () => {
  try {
    return await app.getGPUInfo("complete");
  } catch (error) {
    console.error("Failed to get GPU info:", error);
    return null;
  }
});

ipcMain.handle("get-app-version", () => {
  return `${app.getVersion()} ${
    FEATURE_FLAGS.APP_STORE_BUILD ? "MAC-APP-STORE" : "FOSS"
  }`;
});

ipcMain.handle("copy-image-to-clipboard", async (_event, filePath: string) => {
  try {
    const image = nativeImage.createFromPath(filePath);
    if (image.isEmpty()) {
      console.error("Image is empty at path:", filePath);
      return false;
    }
    clipboard.writeImage(image);
    return true;
  } catch (error) {
    console.error("Failed to copy image to clipboard:", error);
    return false;
  }
});

let aiAssistantWin: BrowserWindow | null = null;
let aiAssistantPasted = false;
let aiAssistantPasteTimeout: any = null;

ipcMain.handle("open-ai-assistant", async (_event, { prompt, filePath }) => {
  // Reset state for new request
  aiAssistantPasted = false;
  if (aiAssistantPasteTimeout) {
    clearTimeout(aiAssistantPasteTimeout);
    aiAssistantPasteTimeout = null;
  }

  // 1. Copy image to clipboard first (always do this so it's fresh)
  logit("🤖 Assistant: Copying image to clipboard:", filePath);
  const image = nativeImage.createFromPath(filePath);
  if (image.isEmpty()) {
    logit("❌ Assistant: Image is empty or not found at path:", filePath);
  } else {
    clipboard.writeImage(image);
    logit("✅ Assistant: Image copied to clipboard");
  }

  if (aiAssistantWin && !aiAssistantWin.isDestroyed()) {
    aiAssistantWin.focus();
    // Re-trigger automation if window is already open
    const chatUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
    logit("🤖 Assistant: Window already open, navigating to:", chatUrl);
    aiAssistantWin.loadURL(chatUrl);
    return;
  }

  aiAssistantWin = new BrowserWindow({
    width: 1100,
    height: 850,
    title: "KichNet AI Assistant - Trợ lý phục hồi ảnh",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: "persist:kichnet_ai"
    }
  });

  aiAssistantWin.on('closed', () => {
    aiAssistantWin = null;
    aiAssistantPasted = false;
  });

  // 2. Load ChatGPT
  const chatUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  logit("🤖 Assistant: Loading URL:", chatUrl);
  aiAssistantWin.loadURL(chatUrl);

  // 3. Automation Script
  const runAutomation = () => {
    if (!aiAssistantWin || aiAssistantWin.isDestroyed() || aiAssistantPasted) return;
    
    if (aiAssistantPasteTimeout) {
      clearTimeout(aiAssistantPasteTimeout);
    }

    logit("🤖 Assistant: Running automation script...");
    
    const autoPasteJS = `
      (function() {
        function performClickAndFocus() {
          const input = document.querySelector('#prompt-textarea') || 
                        document.querySelector('[contenteditable="true"]') || 
                        document.querySelector('textarea[placeholder*="ChatGPT"]');
          if (input) {
            input.focus();
            const rect = input.getBoundingClientRect();
            ['mousedown', 'mouseup', 'click'].forEach(name => {
              const evt = new MouseEvent(name, {
                view: window, bubbles: true, cancelable: true,
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2
              });
              input.dispatchEvent(evt);
            });
            return true;
          }
          return false;
        }

        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (performClickAndFocus() || attempts > 20) {
            clearInterval(interval);
          }
        }, 1000);
      })();
    `;

    aiAssistantWin.webContents.executeJavaScript(autoPasteJS);

    // Show notification to user
    aiAssistantWin.webContents.executeJavaScript(`
      if (!document.getElementById('kichnet-notify')) {
        const div = document.createElement('div');
        div.id = 'kichnet-notify';
        div.style.position = 'fixed';
        div.style.top = '15px';
        div.style.left = '50%';
        div.style.transform = 'translateX(-50%)';
        div.style.backgroundColor = '#10a37f';
        div.style.color = 'white';
        div.style.padding = '12px 24px';
        div.style.borderRadius = '12px';
        div.style.zIndex = '99999';
        div.style.fontWeight = 'bold';
        div.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
        div.innerHTML = '🤖 <b>KichNet AI Assistant</b><br>Đang tự động dán ảnh... Nếu chưa thấy, hãy nhấn <b>Ctrl+V</b> nhé!';
        document.body.appendChild(div);
        setTimeout(() => { if(div) { div.style.opacity = '0'; div.style.transition = 'opacity 1s'; } }, 8000);
        setTimeout(() => { if(div) div.remove(); }, 9000);
      }
    `);

    // Only try to paste once to avoid duplicates
    aiAssistantPasteTimeout = setTimeout(() => {
      if (!aiAssistantWin || aiAssistantWin.isDestroyed() || aiAssistantPasted) return;
      logit("🤖 Assistant: Attempting single paste...");
      aiAssistantWin.focus();
      
      aiAssistantWin.webContents.paste();
      aiAssistantPasted = true;
      aiAssistantPasteTimeout = null;

      // Robust Auto-send with multiple attempts
      let sendAttempts = 0;
      const trySend = () => {
        if (!aiAssistantWin || aiAssistantWin.isDestroyed() || sendAttempts > 12) return;
        sendAttempts++;
        logit(`🤖 Assistant: Sending attempt ${sendAttempts}...`);
        
        const sendJS = `
          (function() {
            const btn = document.querySelector('[data-testid="send-button"]') || 
                        document.querySelector('button[aria-label="Send prompt"]');
            
            const input = document.querySelector('#prompt-textarea') || 
                          document.querySelector('[contenteditable="true"]');

            if (!btn) return "btn_not_found";
            if (btn.disabled) return "btn_disabled";

            btn.click();
            return "clicked_btn";
          })();
        `;

        aiAssistantWin.webContents.executeJavaScript(sendJS).then((result) => {
          logit(`🤖 Assistant: Send result: ${result}`);
          if (result === "clicked_btn") {
            logit("✅ Assistant: Send command executed successfully!");
            // 4. Start monitoring for response image
            startImageMonitoring();
            return;
          }

          // If button not found or disabled, try Enter key as fallback after a delay
          if (aiAssistantWin && !aiAssistantWin.isDestroyed()) {
            if (sendAttempts % 2 === 0) {
               logit("🤖 Assistant: Fallback - Sending Enter key...");
               aiAssistantWin.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Enter' });
               aiAssistantWin.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Enter' });
            }
            setTimeout(trySend, 2000); // Wait 2s for next attempt
          }
        });
      };

      const startImageMonitoring = () => {
        let lastCapturedUrl = "";
        let checkAttempts = 0;
        logit("🤖 Assistant: Starting high-quality image monitoring...");
        
        const checkInterval = setInterval(async () => {
          if (!aiAssistantWin || aiAssistantWin.isDestroyed() || checkAttempts > 150) { 
            logit("🤖 Assistant: Monitoring stopped.");
            clearInterval(checkInterval);
            return;
          }
          checkAttempts++;

          const findAndCopyJS = `
            (function() {
              window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });

              const messages = document.querySelectorAll('[data-testid^="conversation-turn-"]');
              if (messages.length === 0) return { status: "no_messages" };
              
              const lastMsg = messages[messages.length - 1];
              const img = lastMsg.querySelector('img[src^="blob:"], img[src^="http"]');
              if (!img || img.src.includes('profile')) return { status: "no_image" };
              
              const isGenerating = document.querySelector('button[aria-label="Stop generating"]') || 
                                 img.classList.contains('prose-img-generating');
              if (isGenerating) return { status: "generating" };

              const buttons = Array.from(lastMsg.querySelectorAll('button'));
              let copyBtn = null;
              
              for (const btn of buttons) {
                const label = (btn.getAttribute('aria-label') || '').toLowerCase();
                const text = (btn.innerText || '').toLowerCase();
                if (text.includes('chỉnh sửa') || text.includes('edit') || label.includes('edit')) continue;
                
                const svg = btn.querySelector('svg');
                const svgHTML = svg ? svg.innerHTML : '';
                const isCopyIcon = svgHTML.includes('M7 5h10') || svgHTML.includes('M19 21H8') || label.includes('copy') || label.includes('sao chép');

                if (isCopyIcon) {
                  copyBtn = btn;
                  break;
                }
              }
              
              if (copyBtn) {
                copyBtn.scrollIntoView({ block: 'center' });
                copyBtn.style.outline = '5px solid #10a37f';
                const clickEvt = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
                copyBtn.dispatchEvent(clickEvt);
                return { status: "clicking_copy", url: img.src };
              }

              return { status: "image_found_waiting_btn", url: img.src };
            })();
          `;

          try {
            const result = await aiAssistantWin.webContents.executeJavaScript(findAndCopyJS);
            logit("🤖 Assistant: Monitoring Status: " + (result?.status || "unknown"));
            
            if (result && result.status === "clicking_copy" && result.url !== lastCapturedUrl) {
              logit("🤖 Assistant: Copy button clicked! Fetching from clipboard...");
              lastCapturedUrl = result.url;

              // Wait for clipboard to update after the simulated click
              // Increase wait time because of the scroll action
              setTimeout(() => {
                if (aiAssistantWin && !aiAssistantWin.isDestroyed()) {
                  const cbImage = clipboard.readImage();
                  if (!cbImage.isEmpty()) {
                    const tempPath = path.join(os.tmpdir(), `kichnet_ai_hq_${Date.now()}.png`);
                    fs.writeFileSync(tempPath, cbImage.toPNG() as any);
                    logit("✅ Assistant: High-quality image retrieved from clipboard!");

                    const mainWindow = getMainWindow();
                    if (mainWindow) {
                      mainWindow.webContents.send(ELECTRON_COMMANDS.AI_IMAGE_RECEIVED, tempPath);
                      
                      // Notify user in Assistant window
                      aiAssistantWin.webContents.executeJavaScript(`
                        (function() {
                          const div = document.createElement('div');
                          div.style.position = 'fixed'; div.style.top = '15px'; div.style.left = '50%';
                          div.style.transform = 'translateX(-50%)'; div.style.backgroundColor = '#10a37f';
                          div.style.color = 'white'; div.style.padding = '12px 24px'; div.style.borderRadius = '12px';
                          div.style.zIndex = '999999'; div.style.fontWeight = 'bold';
                          div.innerHTML = '✅ Đã thu hồi ảnh chất lượng cao về App!';
                          document.body.appendChild(div);
                          setTimeout(() => div.remove(), 5000);
                        })();
                      `);
                      
                      // Minimize the assistant window and bring main window to front
                      aiAssistantWin.minimize();
                      if (mainWindow.isMinimized()) mainWindow.restore();
                      mainWindow.focus();

                      clearInterval(checkInterval);
                    }
                  } else {
                    logit("⚠️ Assistant: Clipboard still empty, retrying...");
                    lastCapturedUrl = ""; // Reset to allow retry
                  }
                }
              }, 3000);
            }
          } catch (err: any) {
            logit("❌ Assistant: Monitoring error: " + err.message);
          }
        }, 4000);
      };

      setTimeout(trySend, 4000); // Wait 4s after paste for image to upload
    }, 6000);
  };

  aiAssistantWin.webContents.on('dom-ready', runAutomation);
  aiAssistantWin.webContents.on('did-navigate-in-page', runAutomation);
});

if (!FEATURE_FLAGS.APP_STORE_BUILD) {
  autoUpdater.on("update-downloaded", autoUpdate);
}
