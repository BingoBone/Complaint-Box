// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // serve HTML/CSS/JS files

// PostgreSQL connection
// Make sure to set DATABASE_URL in Render environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render Postgres
});

// Create table if it doesn't exist
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS complaints (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
})();

// Route to submit a complaint
app.post("/submit", async (req, res) => {
  const { complaint } = req.body;
  if (!complaint) return res.status(400).send("Empty complaint");

  try {
    await pool.query("INSERT INTO complaints (text) VALUES ($1)", [complaint]);
    res.status(200).send("Complaint saved");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Password-protected route to view complaints
app.get("/complaints", async (req, res) => {
  const auth = req.headers.authorization;

  // Simple username:password authentication
  const correctAuth = "Basic " + Buffer.from("admin:secret123").toString("base64");
  if (!auth || auth !== correctAuth) {
    res.setHeader("WWW-Authenticate", "Basic realm='Complaints'");
    return res.status(401).send("Access denied");
  }

  try {
    const { rows } = await pool.query("SELECT * FROM complaints ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Optional: password check route for admin login (frontend JS)
app.post("/login", (req, res) => {
  const { password } = req.body;
  if (password === "letmein123") {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
