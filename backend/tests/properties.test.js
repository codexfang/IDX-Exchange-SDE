require("dotenv").config();

const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/db");

jest.setTimeout(30000);

async function groundTruth(where, values) {
  const sql = `SELECT COUNT(*) AS n FROM rets_property WHERE ${where}`;
  const [[row]] = await pool.execute(sql, values);
  return row.n;
}

describe("GET /api/properties", () => {
  afterAll(async () => {
    await pool.end();
  });

  describe("pagination", () => {
    it("returns 20 results by default with a total", async () => {
      const res = await request(app).get("/api/properties");
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(20);
      expect(res.body.offset).toBe(0);
      expect(res.body.results).toHaveLength(20);
      expect(res.body.total).toBe(55212);
    });

    it("?limit=10&offset=20 returns a different page than offset=0", async () => {
      const page1 = await request(app).get("/api/properties?limit=10&offset=0");
      const page2 = await request(app).get("/api/properties?limit=10&offset=20");

      expect(page2.body.results).toHaveLength(10);
      expect(page2.body.offset).toBe(20);

      const ids1 = page1.body.results.map((r) => r.L_ListingID);
      const ids2 = page2.body.results.map((r) => r.L_ListingID);
      expect(ids1).not.toEqual(ids2);
      expect(ids1.some((id) => ids2.includes(id))).toBe(false);
    });
  });

  describe("filters", () => {
    it("city filter returns only that city", async () => {
      const res = await request(app).get("/api/properties?city=Irvine");
      expect(res.status).toBe(200);
      expect(res.body.results.length).toBeGreaterThan(0);
      for (const row of res.body.results) {
        expect(row.L_City.toLowerCase()).toBe("irvine");
      }
    });

    it("zipcode filter returns only that zip", async () => {
      const res = await request(app).get("/api/properties?zipcode=90210");
      expect(res.status).toBe(200);
      for (const row of res.body.results) {
        expect(row.L_Zip).toBe("90210");
      }
    });

    it("minPrice and maxPrice bound the results", async () => {
      const res = await request(app).get(
        "/api/properties?minPrice=300000&maxPrice=900000"
      );
      expect(res.status).toBe(200);
      for (const row of res.body.results) {
        expect(row.L_SystemPrice).toBeGreaterThanOrEqual(300000);
        expect(row.L_SystemPrice).toBeLessThanOrEqual(900000);
      }
    });

    it("beds and baths filter the results", async () => {
      const res = await request(app).get("/api/properties?beds=3&baths=2");
      expect(res.status).toBe(200);
      for (const row of res.body.results) {
        expect(row.L_Keyword2).toBeGreaterThanOrEqual(3);
        expect(parseFloat(row.LM_Dec_3)).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe("DEBUG CHALLENGE: combined filters must not distort the total", () => {
    it("minPrice + beds returns the true count", async () => {
      const res = await request(app).get(
        "/api/properties?minPrice=300000&beds=3&limit=20"
      );
      expect(res.status).toBe(200);

      const expected = await groundTruth(
        "L_SystemPrice >= ? AND L_Keyword2 >= ?",
        [300000, 3]
      );

      expect(res.body.total).toBe(expected);
    });

    it("minPrice + beds + city returns the true count", async () => {
      const res = await request(app).get(
        "/api/properties?minPrice=300000&beds=3&city=Irvine"
      );
      expect(res.status).toBe(200);

      const expected = await groundTruth(
        "L_SystemPrice >= ? AND L_Keyword2 >= ? AND LOWER(TRIM(L_City)) = ?",
        [300000, 3, "irvine"]
      );

      expect(res.body.total).toBe(expected);
    });

    it("every multi-filter combination agrees with the database", async () => {
      const cases = [
        { qs: "minPrice=300000&beds=3", where: "L_SystemPrice >= ? AND L_Keyword2 >= ?", vals: [300000, 3] },
        { qs: "minPrice=500000&maxPrice=2000000&beds=4", where: "L_SystemPrice >= ? AND L_SystemPrice <= ? AND L_Keyword2 >= ?", vals: [500000, 2000000, 4] },
        { qs: "city=Irvine&minPrice=300000&beds=3", where: "L_SystemPrice >= ? AND L_Keyword2 >= ? AND LOWER(TRIM(L_City)) = ?", vals: [300000, 3, "irvine"] },
        { qs: "zipcode=90210&minPrice=300000", where: "L_SystemPrice >= ? AND TRIM(L_Zip) = ?", vals: [300000, "90210"] },
        { qs: "city=Irvine&beds=3&baths=2", where: "L_Keyword2 >= ? AND LM_Dec_3 >= ? AND LOWER(TRIM(L_City)) = ?", vals: [3, 2, "irvine"] },
        { qs: "city=Irvine&maxPrice=1500000", where: "L_SystemPrice <= ? AND LOWER(TRIM(L_City)) = ?", vals: [1500000, "irvine"] },
      ];

      for (const c of cases) {
        const res = await request(app).get(`/api/properties?${c.qs}`);
        expect(res.status).toBe(200);
        const expected = await groundTruth(c.where, c.vals);
        expect({ qs: c.qs, total: res.body.total }).toEqual({
          qs: c.qs,
          total: expected,
        });
      }
    });
  });

  describe("validation", () => {
    const bad = [
      "?minPrice=abc",
      "?maxPrice=abc",
      "?beds=abc",
      "?baths=abc",
      "?limit=0",
      "?limit=200",
      "?limit=-1",
      "?limit=abc",
      "?offset=-1",
      "?offset=abc",
      "?zipcode=9021",
      "?zipcode=abcde",
      "?city=Irvine&minPrice=900000&maxPrice=100000",
    ];

    it.each(bad)("returns 400 with a message for %s", async (qs) => {
      const res = await request(app).get(`/api/properties${qs}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid query parameters");
      expect(Array.isArray(res.body.details)).toBe(true);
      expect(res.body.details.length).toBeGreaterThan(0);
    });
  });
});