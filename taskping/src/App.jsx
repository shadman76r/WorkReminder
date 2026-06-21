import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState("");

 useEffect(() => {
  loadReminders();

  if (window.electronAPI) {
    window.electronAPI.onReminderAlert((reminder) => {
      alert(`Reminder: ${reminder.title}`);
      loadReminders();
    });
  }
}, []);
  const loadReminders = async () => {
    try {
      if (!window.electronAPI) {
        setError("Electron API not connected. Run the app using: npm start");
        return;
      }

      const data = await window.electronAPI.getReminders();
      setReminders(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const addReminder = async () => {
    try {
      setError("");

      if (!window.electronAPI) {
        setError("Electron API not connected. Do not use npm run dev. Use npm start.");
        return;
      }

      if (!title.trim()) {
        setError("Please enter reminder title.");
        return;
      }

      if (!time) {
        setError("Please select reminder date and time.");
        return;
      }

      const reminder = {
        id: Date.now(),
        title: title.trim(),
        time,
        done: false,
      };

      const updated = await window.electronAPI.addReminder(reminder);

      setReminders(updated || []);
      setTitle("");
      setTime("");
    } catch (err) {
      setError("Add reminder failed: " + err.message);
    }
  };

  const deleteReminder = async (id) => {
    try {
      const updated = await window.electronAPI.deleteReminder(id);
      setReminders(updated || []);
    } catch (err) {
      setError("Delete failed: " + err.message);
    }
  };

  const pendingCount = reminders.filter((r) => !r.done).length;
  const doneCount = reminders.filter((r) => r.done).length;

  return (
    <div className="app">
      <div className="hero">
        <div>
          <p className="tag">Desktop Reminder App</p>
          <h1>TaskPing</h1>
          <p className="subtitle">
            Set your work reminder and get notified on your laptop.
          </p>
        </div>

        <div className="stats">
          <div>
            <h3>{pendingCount}</h3>
            <p>Pending</p>
          </div>
          <div>
            <h3>{doneCount}</h3>
            <p>Done</p>
          </div>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="panel">
        <h2>Add New Reminder</h2>

        <div className="form">
          <input
            type="text"
            placeholder="Example: Work on e-commerce automation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

          <button type="button" onClick={addReminder}>
            Add Reminder
          </button>
        </div>
      </div>

      <div className="section-title">
        <h2>Your Reminders</h2>
        <p>{reminders.length} total reminders</p>
      </div>

      <div className="list">
        {reminders.length === 0 && (
          <div className="empty">
            <h3>No reminders yet</h3>
            <p>Add your first reminder and TaskPing will notify you.</p>
          </div>
        )}

        {[...reminders]
          .sort((a, b) => new Date(a.time) - new Date(b.time))
          .map((reminder) => (
            <div
              className={`card ${reminder.done ? "done" : ""}`}
              key={reminder.id}
            >
              <div className="card-left">
                <div className="status-dot"></div>

                <div>
                  <h3>{reminder.title}</h3>
                  <p>{new Date(reminder.time).toLocaleString()}</p>
                  <span>{reminder.done ? "Completed" : "Pending"}</span>
                </div>
              </div>

              <button
                type="button"
                className="delete-btn"
                onClick={() => deleteReminder(reminder.id)}
              >
                Delete
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

export default App;