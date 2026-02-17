const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = process.env.NODE_ENV === "development";
const PORT = process.env.PORT || 3000;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Cargar la aplicación Next.js
  if (isDev) {
    win.loadURL(`http://localhost:${PORT}`);
    win.webContents.openDevTools();
    win.setMenu(null);
  } else {
    // Producción: cargar archivos estáticos
    win.loadFile(path.join(__dirname, "../src/out/index.html"));
    win.setMenu(null);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
