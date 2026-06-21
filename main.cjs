const { app, BrowserWindow, Notification, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

let dataPath;

if (process.platform === "win32") {
  app.setAppUserModelId("com.taskping.reminder");
}

function createWindow() {
  dataPath = path.join(app.getPath("userData"), "reminders.json");

  const win = new BrowserWindow({
    width: 900,
    height: 650,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:5173");
}

function readReminders() {
  try {
    if (!fs.existsSync(dataPath)) return [];
    return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  } catch {
    return [];
  }
}

function saveReminders(reminders) {
  fs.writeFileSync(dataPath, JSON.stringify(reminders, null, 2));
}

function showReminder(reminder) {
  console.log("Reminder triggered:", reminder.title);

  if (Notification.isSupported()) {
    new Notification({
      title: "TaskPing Reminder",
      body: reminder.title,
      silent: false,
    }).show();
  }

  if (BrowserWindow.getAllWindows().length > 0) {
    BrowserWindow.getAllWindows()[0].webContents.send("reminder-alert", reminder);
  }
}

ipcMain.handle("get-reminders", () => {
  return readReminders();
});

ipcMain.handle("add-reminder", (event, reminder) => {
  const reminders = readReminders();
  reminders.push(reminder);
  saveReminders(reminders);
  return reminders;
});

ipcMain.handle("delete-reminder", (event, id) => {
  const reminders = readReminders().filter((r) => r.id !== id);
  saveReminders(reminders);
  return reminders;
});

setInterval(() => {
  if (!dataPath) return;

  const reminders = readReminders();
  const now = Date.now();

  let changed = false;

  const updated = reminders.map((r) => {
    if (!r.done && new Date(r.time).getTime() <= now) {
      showReminder(r);
      changed = true;
      return { ...r, done: true };
    }

    return r;
  });

  if (changed) {
    saveReminders(updated);
  }
}, 1000);

app.whenReady().then(createWindow);