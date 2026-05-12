const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = 3000;

app.use(express.json());

// Connect to SQLite database file
// If file does not exist, it will be created automatically
const db = new sqlite3.Database("./tasks.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

// Create tasks table if it does not exist
db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Health check
app.get("/", (req, res) => {
  res.send("Task CRUD API with SQLite is running");
});

// CREATE task
app.post("/tasks", (req, res) => {
  const { title, completed } = req.body;

  if (!title) {
    return res.status(400).json({ error: "title is required" });
  }

  const sql = `INSERT INTO tasks (title, completed) VALUES (?, ?)`;
  const params = [title, completed ? 1 : 0];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error creating task:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    db.get(`SELECT * FROM tasks WHERE id = ?`, [this.lastID], (err, row) => {
      if (err) {
        console.error("Error fetching created task:", err.message);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.status(201).json(row);
    });
  });
});

// READ all tasks
app.get("/tasks", (req, res) => {
  db.all(`SELECT * FROM tasks ORDER BY id ASC`, [], (err, rows) => {
    if (err) {
      console.error("Error fetching tasks:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(rows);
  });
});

// READ one task
app.get("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error("Error fetching task:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!row) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(row);
  });
});

// UPDATE task
app.put("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;

  if (title === undefined || completed === undefined) {
    return res.status(400).json({
      error: "Both title and completed are required"
    });
  }

  const sql = `UPDATE tasks SET title = ?, completed = ? WHERE id = ?`;
  const params = [title, completed ? 1 : 0, id];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("Error updating task:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, row) => {
      if (err) {
        console.error("Error fetching updated task:", err.message);
        return res.status(500).json({ error: "Internal server error" });
      }
      res.json(row);
    });
  });
});

// DELETE task
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.get(`SELECT * FROM tasks WHERE id = ?`, [id], (err, row) => {
    if (err) {
      console.error("Error finding task:", err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!row) {
      return res.status(404).json({ error: "Task not found" });
    }

    db.run(`DELETE FROM tasks WHERE id = ?`, [id], function (err) {
      if (err) {
        console.error("Error deleting task:", err.message);
        return res.status(500).json({ error: "Internal server error" });
      }

      res.json({
        message: "Task deleted successfully",
        task: row
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});