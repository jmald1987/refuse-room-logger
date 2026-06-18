const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "refuse-room-logger-api" });
});

app.post("/entry", async (req, res) => {
  try {
    const { floor, dust, stains, trash, mop } = req.body;

    if (!floor) {
      return res.status(400).json({ error: "floor is required" });
    }

    if (!dust && !stains && !trash && !mop) {
      return res.status(400).json({ error: "at least one issue must be selected" });
    }

    const result = await pool.query(
      `
      INSERT INTO entries (floor, dust, stains, trash, mop)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
      `,
      [floor, dust, stains, trash, mop]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("POST /entry error:", error);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/entries", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM entries
      ORDER BY created_at DESC
      LIMIT 100
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error("GET /entries error:", error);
    res.status(500).json({ error: "server error" });
  }
});


app.listen(PORT, () => {
  console.log(`Refuse Room Logger API running on port ${PORT}`);
});