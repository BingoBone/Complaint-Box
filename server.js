const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // serve your HTML file

// Create or open a database
const db = new sqlite3.Database("./complaints.db");

// Create table if it doesn’t exist
db.run(`
  CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Route to handle complaint submission
app.post("/submit", (req, res) => {
  const { complaint } = req.body;
  if (!complaint) return res.status(400).send("Empty complaint");

  db.run("INSERT INTO complaints (text) VALUES (?)", [complaint], (err) => {
    if (err) return res.status(500).send("Database error");
    res.status(200).send("Complaint saved");
  });
});

// Route to view complaints
app.get("/complaints", (req, res) => {
  db.all("SELECT * FROM complaints ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).send("Database error");
    res.json(rows);
  });
});

app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === "iwannasee") {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
