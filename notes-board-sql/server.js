const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();

app.use(express.json());
app.use(express.static("public")); // serve your HTML/CSS/JS

// Connect to SQLite (creates file if missing)
const db = new sqlite3.Database("./notes.db");

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL
`);

// Add a note
app.post("/api/add", (req, res) => {
    const { text } = req.body;
    db.run("INSERT INTO notes (text) VALUES (?)", [text], function () {
        res.json({ id: this.lastID, text });
    });
});

// Get all notes
app.get("/api/notes", (req, res) => {
    db.all("SELECT * FROM notes ORDER BY id DESC", (err, rows) => {
        res.json(rows);
    });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));