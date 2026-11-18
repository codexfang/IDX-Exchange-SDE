require("dotenv").config();

const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/db");

jest.setTimeout(30000);

function prices(rows) {
  return rows.map((row) => row.L_SystemPrice);
}

function isNonDecreasing(values) {
  return values.every((value, index) => index === 0 || values[index - 1] <= value);
}

function isNonIncreasing(values) {
  return values.every((value, index) => index === 0 || values[index - 1] >= value);
}

function timestamps(rows) {
  return rows
    .map((row) => new Date(row.ListingContractDate).getTime())
    .filter((value) => Number.isFinite(value));
}

describe("GET /api/properties?sortBy", () => {
  afterAll(async () => {
    await pool.end();
  });

  describe("price", () => {
    it("sorts low to high", async () => {
      const res = await request(app).get(
        "/api/properties?sortBy=L_SystemPrice&sortOrder=asc&limit=20"
      );

      expect(res.status).toBe(200);
      expect(res.body.sortBy).toBe("L_SystemPrice");
      expect(res.body.sortOrder).toBe("asc");
      expect(res.body.results).toHaveLength(20);
      expect(isNonDecreasing(prices(res.body.results))).toBe(true);

      // The cheapest listing in the whole table must be on the first page.
      const [[cheapest]] = await pool.query(
        "SELECT MIN(L_SystemPrice) AS min FROM rets_property WHERE L_SystemPrice IS NOT NULL"
      );
      expect(res.body.results[0].L_SystemPrice).toBe(Number(cheapest.min));
    });

    it("sorts high to low", async () => {
      const res = await request(app).get(
        "/api/properties?sortBy=L_SystemPrice&sortOrder=desc&limit=20"
      );

      expect(res.status).toBe(200);
      expect(isNonIncreasing(prices(res.body.results))).toBe(true);

      const [[expensive]] = await pool.query(
        "SELECT MAX(L_SystemPrice) AS max FROM rets_property WHERE L_SystemPrice IS NOT NULL"
      );
      expect(res.body.results[0].L_SystemPrice).toBe(Number(expensive.max));
    });

    it("defaults to ascending when sortOrder is omitted", async () => {
      const res = await request(app).get("/api/properties?sortBy=L_SystemPrice");
      expect(res.status).toBe(200);
      expect(res.body.sortOrder).toBe("asc");
      expect(isNonDecreasing(prices(res.body.results))).toBe(true);
    });
  });

  describe("other sortable columns", () => {
    it("sorts by date listed, newest first", async () => {
      const res = await request(app).get(
        "/api/properties?sortBy=ListingContractDate&sortOrder=desc&limit=20"
      );

      expect(res.status).toBe(200);
      const dates = timestamps(res.body.results);
      expect(dates.length).toBeGreaterThan(0);
      expect(isNonIncreasing(dates)).toBe(true);
    });

    it("sorts by square footage", async () => {
      const res = await request(app).get(
        "/api/properties?sortBy=LM_Int2_3&sortOrder=asc&limit=20"
      );

      expect(res.status).toBe(200);
      const values = res.body.results.map((row) => Number(row.LM_Int2_3));
      expect(isNonDecreasing(values)).toBe(true);
    });

    it("sorts by beds, most first", async () => {
      const res = await request(app).get(
        "/api/properties?sortBy=L_Keyword2&sortOrder=desc&limit=20"
      );

      expect(res.status).toBe(200);
      const values = res.body.results.map((row) => Number(row.L_Keyword2));
      expect(isNonIncreasing(values)).toBe(true);
    });

    it("leaves out rows with no value for the sort column and counts only what it shows", async () => {
      const res = await request(app).get(
        "/api/properties?sortBy=LM_Int2_3&sortOrder=asc&limit=20"
      );

      expect(res.status).toBe(200);
      expect(res.body.results.every((row) => row.LM_Int2_3 !== null)).toBe(true);

      const [[truth]] = await pool.query(
        "SELECT COUNT(*) AS n FROM rets_property WHERE LM_Int2_3 IS NOT NULL"
      );
      expect(res.body.total).toBe(truth.n);
      expect(res.body.total).toBeLessThan(55212);
    });
  });

  describe("sorting with filters and pagination", () => {
    it("keeps the price order across pages without repeating rows", async () => {
      const page1 = await request(app).get(
        "/api/properties?sortBy=L_SystemPrice&sortOrder=asc&limit=20&offset=0"
      );
      const page2 = await request(app).get(
        "/api/properties?sortBy=L_SystemPrice&sortOrder=asc&limit=20&offset=20"
      );

      expect(isNonDecreasing(prices(page1.body.results))).toBe(true);
      expect(isNonDecreasing(prices(page2.body.results))).toBe(true);

      const lastOfPage1 = page1.body.results[19].L_SystemPrice;
      const firstOfPage2 = page2.body.results[0].L_SystemPrice;
      expect(firstOfPage2).toBeGreaterThanOrEqual(lastOfPage1);

      const ids1 = new Set(page1.body.results.map((row) => row.L_ListingID));
      expect(page2.body.results.some((row) => ids1.has(row.L_ListingID))).toBe(false);
    });

    it("sorts the filtered subset and keeps the filtered total", async () => {
      const res = await request(app).get(
        "/api/properties?beds=4&sortBy=L_SystemPrice&sortOrder=asc&limit=20"
      );

      expect(res.status).toBe(200);
      for (const row of res.body.results) {
        expect(Number(row.L_Keyword2)).toBeGreaterThanOrEqual(4);
      }
      expect(isNonDecreasing(prices(res.body.results))).toBe(true);

      const [[truth]] = await pool.query(
        "SELECT COUNT(*) AS n FROM rets_property WHERE L_Keyword2 >= ?",
        [4]
      );
      expect(res.body.total).toBe(truth.n);
    });
  });

  describe("validation", () => {
    it("rejects RESO style names that are not columns in rets_property", async () => {
      const res = await request(app).get("/api/properties?sortBy=ListPrice");

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid query parameters");
      expect(res.body.details.join(" ")).toMatch(/sortBy/);
    });

    it("rejects unknown and injection style sortBy values", async () => {
      const bad = ["id", "price", "L_Address", "L_SystemPrice; DROP TABLE rets_property", "1"];

      for (const sortBy of bad) {
        const res = await request(app).get(
          `/api/properties?sortBy=${encodeURIComponent(sortBy)}`
        );
        expect({ sortBy, status: res.status }).toEqual({ sortBy, status: 400 });
      }
    });

    it("rejects an invalid sortOrder", async () => {
      const res = await request(app).get(
        "/api/properties?sortBy=L_SystemPrice&sortOrder=up"
      );

      expect(res.status).toBe(400);
      expect(res.body.details.join(" ")).toMatch(/sortOrder/);
    });

    it("rejects sortOrder without sortBy", async () => {
      const res = await request(app).get("/api/properties?sortOrder=desc");

      expect(res.status).toBe(400);
      expect(res.body.details.join(" ")).toMatch(/sortOrder requires sortBy/);
    });

    it("returns 400 even when another filter is also invalid", async () => {
      const res = await request(app).get("/api/properties?sortBy=ListPrice&limit=500");

      expect(res.status).toBe(400);
      expect(res.body.details.length).toBeGreaterThanOrEqual(2);
    });
  });
});
