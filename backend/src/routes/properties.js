const express = require("express");
const pool = require("../db");
const { SELECT_COLUMNS, validate, buildWhere } = require("../propertyQuery");

const router = express.Router();

router.get("/", async (req, res) => {
  const { errors, clean } = validate(req.query);

  if (errors) {
    return res.status(400).json({
      error: "Invalid query parameters",
      details: errors,
    });
  }

  const { where, values } = buildWhere(clean);

  try {
    const countSql = `SELECT COUNT(*) AS total FROM rets_property ${where}`;
    const [[countRow]] = await pool.query(countSql, values);

    const dataSql = `
      SELECT ${SELECT_COLUMNS}
      FROM rets_property
      ${where}
      ORDER BY id
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSql, [...values, clean.limit, clean.offset]);

    res.json({
      total: countRow.total,
      limit: clean.limit,
      offset: clean.offset,
      results: rows,
    });
  } catch (err) {
    console.error("[properties] query failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;