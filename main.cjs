const { app, BrowserWindow, Notification, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;
let reminders = [];
let dataPath;

function createWindow() {
  dataPath = path.join(app.getPath("userData"), "reminders.json");

  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL("http://localhost:5173");
}

function readReminders() {
  try {
    if (!fs.existsSync(dataPath)) return [];
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    return [];
  }
}

function saveReminders() {
  fs.writeFileSync(dataPath, JSON.stringify(reminders, null, 2));
}

ipcMain.handle("get-reminders", () => {
  reminders = readReminders();
  return reminders;
});

ipcMain.handle("add-reminder", (event, reminder) => {
  reminders = readReminders();
  reminders.push(reminder);
  saveReminders();
  return reminders;
});

ipcMain.handle("delete-reminder", (event, id) => {
  reminders = readReminders().filter((r) => r.id !== id);
  saveReminders();
  return reminders;
});

setInterval(() => {
  if (!dataPath) return;

  reminders = readReminders();
  const now = new Date();

  let changed = false;

  reminders = reminders.map((r) => {
    if (!r.done && new Date(r.time).getTime() <= now.getTime()) {
      new Notification({
        title: "TaskPing Reminder",
        body: r.title,
      }).show();

      changed = true;
      return { ...r, done: true };
    }

    return r;
  });

  if (changed) saveReminders();
}, 3000);

app.whenReady().then(createWindow);