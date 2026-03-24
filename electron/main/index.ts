import { app, BrowserWindow, ipcMain, Menu } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { perf } from "@shared/perf";
import { windowManager } from "./window-manager";

perf.mark("main:module-load");

// Forward renderer [perf] logs to terminal
ipcMain.on("main-process-message", (_, msg) => {
  if (typeof msg === "string" && msg.startsWith("[perf]")) {
    console.log(msg.replace("[perf]", "[perf:renderer]"));
  }
});

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Application menu with New Window shortcut
function buildAppMenu() {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Window",
          accelerator: "CmdOrCtrl+N",
          click: () => windowManager.createWindow(),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        ...(isMac ? [{ role: "selectAll" as const }] : [{ role: "selectAll" as const }]),
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(async () => {
  perf.mark("main:app-ready");

  buildAppMenu();

  // Register window handlers globally (no longer per-window)
  const { registerWindowHandlers } = await import("./ipc/window.handler");
  registerWindowHandlers();
  windowManager.registerIpcHandlers();

  // New window IPC handlers
  ipcMain.handle("window:new", () => {
    windowManager.createWindow();
  });

  ipcMain.handle("window:new-with-repo", (_, repositoryId: number) => {
    windowManager.createWindow({ repositoryId });
  });

  // Restore previous session or create a fresh window
  const restored = await windowManager.restoreSession();
  if (!restored) {
    windowManager.createWindow();
  }

  // Register all other IPC handlers in parallel
  const endHandlers = perf.start("main:register-ipc-handlers");
  const [
    { registerRepositoryHandlers },
    { registerCommitHistoryHandlers },
    { registerAvatarHandlers },
    { registerSettingsHandlers },
  ] = await Promise.all([
    import("../../src/main/ipc/repository.handler"),
    import("../../src/main/ipc/commit-history.handler"),
    import("../../src/main/ipc/avatar.handler"),
    import("../../src/main/ipc/settings.handler"),
  ]);

  registerRepositoryHandlers();
  registerCommitHistoryHandlers();
  registerAvatarHandlers();
  registerSettingsHandlers();
  endHandlers();
  perf.mark("main:all-handlers-registered");

  // Pre-fetch sidebar data and cache it for all windows
  const { repositoryService } = await import(
    "../../src/main/services/repository.service"
  );
  const { avatarService } = await import(
    "../../src/main/services/avatar.service"
  );
  const { settingsService } = await import(
    "../../src/main/services/settings.service"
  );

  const [repos, accounts, activeAccountId, collapsedGroups] =
    await Promise.all([
      repositoryService.getAllRepositories(),
      settingsService.getSetting("accounts"),
      settingsService.getSetting("active_account_id"),
      settingsService.getSetting("sidebar_collapsed_groups"),
    ]);

  const owners = [
    ...new Set(
      repos
        .map((r) => {
          const url = r.remoteUrl || "";
          const httpsMatch = url.match(/https?:\/\/[^/]+\/([^/]+)\//);
          if (httpsMatch) return httpsMatch[1];
          const sshMatch = url.match(/git@[^:]+:([^/]+)\//);
          if (sshMatch) return sshMatch[1];
          return "Local";
        })
        .filter((o) => o !== "Local"),
    ),
  ];

  const ownerAvatars = await avatarService.getOwnerAvatars(owners);

  // Push to all existing windows and cache for future windows
  windowManager.pushSidebarDataToAll({
    repos,
    accounts,
    activeAccountId,
    collapsedGroups,
    ownerAvatars,
  });
  perf.mark("main:sidebar-data-pushed");
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  // Open a new window when a second instance is attempted
  windowManager.createWindow();
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    windowManager.createWindow();
  }
});

// Register IPC handlers
import { registerGitHandlers } from "./ipc/git.handler";
import { registerShellHandlers } from "./ipc/shell.handler";
import { registerEditorHandlers } from "./ipc/editor.handler";

registerGitHandlers();
registerShellHandlers();
registerEditorHandlers();
