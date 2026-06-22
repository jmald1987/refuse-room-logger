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

app.post("/recyclables", async (req, res) => {
  try {
    const {
      blue_bags,
      clear_bags,
      bales
    } = req.body;

    const result = await pool.query(
      `INSERT INTO recyclables
      (blue_bags, clear_bags, bales)
      VALUES ($1, $2, $3)
      RETURNING *`,
      [
        blue_bags,
        clear_bags,
        bales
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

app.get("/recyclables", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM recyclables ORDER BY created_at DESC"
  );

  res.json(result.rows);
});

app.listen(PORT, () => {
  console.log(`Refuse Room Logger API running on port ${PORT}`);
});