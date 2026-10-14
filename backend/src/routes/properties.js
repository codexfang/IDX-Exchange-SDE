const express = require("express");
const pool = require("../db");
const {
  SELECT_COLUMNS,
  DETAIL_COLUMNS,
  validate,
  buildWhere,
  validateListingId,
} = require("../propertyQuery");

const router = express.Router();

// L_Photos is a longtext column holding a JSON array of image URLs. Some rows
// have an empty string instead of "[]", which JSON.parse rejects, so fall back
// to an empty array rather than letting the request fail.
function parsePhotos(raw) {
  if (typeof raw !== "string" || raw.trim() === "") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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

router.get("/:id/openhouses", async (req, res) => {
  const { error, listingId } = validateListingId(req.params.id);

  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const [[property]] = await pool.query(
      "SELECT L_ListingID FROM rets_property WHERE L_ListingID = ? LIMIT 1",
      [listingId]
    );

    if (!property) {
      return res.status(404).json({
        error: "Property not found",
        message: `No property exists with listing ID ${listingId}`,
      });
    }

    const [openHouses] = await pool.query(
      `
      SELECT
        id,
        L_ListingID,
        L_DisplayId,
        OpenHouseDate,
        OH_StartTime,
        OH_EndTime,
        OH_StartDate,
        OH_EndDate,
        all_data,
        updated_date
      FROM rets_openhouse
      WHERE L_ListingID = ?
      ORDER BY OpenHouseDate ASC, OH_StartTime ASC
    `,
      [listingId]
    );

    res.json({
      listingId,
      count: openHouses.length,
      openHouses,
    });
  } catch (err) {
    console.error("[openhouses] query failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const { error, listingId } = validateListingId(req.params.id);

  if (error) {
    return res.status(400).json({ error });
  }

  try {
    const [[property]] = await pool.query(
      `SELECT ${DETAIL_COLUMNS} FROM rets_property WHERE L_ListingID = ? LIMIT 1`,
      [listingId]
    );

    if (!property) {
      return res.status(404).json({
        error: "Property not found",
        message: `No property exists with listing ID ${listingId}`,
      });
    }

    const photos = parsePhotos(property.L_Photos);

    res.json({
      ...property,
      photoCount: photos.length,
      photos,
    });
  } catch (err) {
    console.error("[property detail] query failed:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;