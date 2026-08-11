// Processo principal do Electron — Amor de Brigadeiro (app desktop offline).
// Sobe o servidor Node gerado em .output-electron e abre a janela do app.
const { app, BrowserWindow, shell, Menu } = require("electron");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

const PORT = 43117;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;

let serverProcess = null;
let mainWindow = null;

function serverEntry() {
  const base = app.isPackaged
    ? path.join(process.resourcesPath, "app", ".output-electron")
    : path.join(__dirname, "..", ".output-electron");
  return path.join(base, "server", "index.mjs");
}

function startServer() {
  serverProcess = spawn(process.execPath, [serverEntry()], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      HOST,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProcess.stdout.on("data", (d) => console.log(`[server] ${d}`));
  serverProcess.stderr.on("data", (d) => console.error(`[server] ${d}`));
}

function waitForServer(retries = 120) {
  return new Promise((resolve, reject) => {
    const attempt = (left) => {
      const req = http.get(BASE_URL, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (left <= 0) return reject(new Error("Servidor local nao respondeu."));
        setTimeout(() => attempt(left - 1), 250);
      });
    };
    attempt(retries);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: "#fdf6ec",
    title: "Amor de Brigadeiro",
    icon: path.join(__dirname, "icon.png"),
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false },
  });

  Menu.setApplicationMenu(null);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  try {
    await waitForServer();
    await mainWindow.loadURL(BASE_URL);
  } catch (err) {
    await mainWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          `<body style="font-family:sans-serif;background:#fdf6ec;color:#4a2c1a;padding:40px">
             <h1>Nao foi possivel iniciar o sistema</h1><p>${String(err)}</p></body>`,
        ),
    );
  }
  mainWindow.show();
}

app.whenReady().then(() => {
  startServer();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => app.quit());

app.on("quit", () => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});
