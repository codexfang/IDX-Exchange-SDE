#!/usr/bin/env node

// Measures the listings filter combinations that people actually use, so index
// changes can be argued with numbers instead of guesses.
//
//   node backend/scripts/measure-queries.js
//
// Prints one EXPLAIN summary and the median runtime per query.

require("dotenv").config();

const pool = require("../src/db");

const RUNS = 5;

// Each entry mirrors the WHERE/ORDER BY that GET /api/properties generates.
const QUERIES = [
  {
    name: "city + price range + beds (ORDER BY id)",
    sql: `SELECT L_ListingID, L_SystemPrice, L_Photos FROM rets_property
          WHERE LOWER(TRIM(L_City)) = ? AND L_SystemPrice BETWEEN ? AND ?
            AND L_Keyword2 >= ?
          ORDER BY id ASC LIMIT 20`,
    values: ["irvine", 300000, 900000, 3],
  },
  {
    name: "city + price range (ORDER BY price DESC)",
    sql: `SELECT L_ListingID, L_SystemPrice, L_Photos FROM rets_property
          WHERE LOWER(TRIM(L_City)) = ? AND L_SystemPrice >= ?
          ORDER BY L_SystemPrice DESC, id DESC LIMIT 20`,
    values: ["irvine", 500000],
  },
  {
    name: "zip + max price",
    sql: `SELECT L_ListingID, L_SystemPrice, L_Photos FROM rets_property
          WHERE TRIM(L_Zip) = ? AND L_SystemPrice <= ?
          ORDER BY id ASC LIMIT 20`,
    values: ["90210", 2000000],
  },
  {
    name: "price range + beds + baths",
    sql: `SELECT L_ListingID, L_SystemPrice, L_Photos FROM rets_property
          WHERE L_SystemPrice >= ? AND L_Keyword2 >= ? AND LM_Dec_3 >= ?
          ORDER BY L_SystemPrice ASC, id ASC LIMIT 20`,
    values: [300000, 3, 2],
  },
  {
    name: "price range + beds, sorted by price DESC",
    sql: `SELECT L_ListingID, L_SystemPrice, L_Photos FROM rets_property
          WHERE L_SystemPrice >= ? AND L_Keyword2 >= ?
          ORDER BY L_SystemPrice DESC, id DESC LIMIT 20`,
    values: [500000, 4],
  },
  {
    name: "beds + baths only",
    sql: `SELECT L_ListingID, L_SystemPrice, L_Photos FROM rets_property
          WHERE L_Keyword2 >= ? AND LM_Dec_3 >= ?
          ORDER BY id ASC LIMIT 20`,
    values: [4, 3],
  },
  {
    name: "count for city + price range + beds",
    sql: `SELECT COUNT(*) AS total FROM rets_property
          WHERE LOWER(TRIM(L_City)) = ? AND L_SystemPrice BETWEEN ? AND ?
            AND L_Keyword2 >= ?`,
    values: ["irvine", 300000, 900000, 3],
  },
];

async function timeQuery(query) {
  const timings = [];

  // One warm run so the numbers reflect a warm buffer pool.
  await pool.query(query.sql, query.values);

  for (let i = 0; i < RUNS; i += 1) {
    const startedAt = process.hrtime.bigint();
    await pool.query(query.sql, query.values);
    timings.push(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
  }

  timings.sort((a, b) => a - b);
  return timings[Math.floor(timings.length / 2)];
}

async function explain(query) {
  const [rows] = await pool.query(`EXPLAIN ${query.sql}`, query.values);
  return rows[0];
}

async function main() {
  for (const query of QUERIES) {
    const plan = await explain(query);
    const median = await timeQuery(query);

    console.log(`\n${query.name}`);
    console.log(
      `  type=${plan.type} key=${plan.key || "NULL"} rows=${plan.rows} filtered=${plan.filtered}`
    );
    console.log(`  extra=${plan.Extra}`);
    console.log(`  median=${median.toFixed(1)}ms`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
