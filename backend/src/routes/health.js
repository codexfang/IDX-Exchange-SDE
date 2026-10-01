const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error("[health] database check failed:", err.message);
    res.status(500).json({ status: "error", database: "unreachable" });
  }
});

module.exports = router;
