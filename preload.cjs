const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getReminders: () => ipcRenderer.invoke("get-reminders"),
  addReminder: (reminder) => ipcRenderer.invoke("add-reminder", reminder),
  deleteReminder: (id) => ipcRenderer.invoke("delete-reminder", id),

  onReminderAlert: (callback) => {
    ipcRenderer.on("reminder-alert", (event, reminder) => callback(reminder));
  },
});