require("dotenv").config();

const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/db");
const { validateListingId } = require("../src/propertyQuery");

jest.setTimeout(30000);

afterAll(async () => {
  await pool.end();
});

describe("GET /api/properties/:id", () => {

  it("returns the full property object for a known ID", async () => {
    const res = await request(app).get("/api/properties/1118422731");
    expect(res.status).toBe(200);
    expect(res.body.L_ListingID).toBe("1118422731");
    expect(res.body.L_Address).toBe("1461 Laurel Way");
    expect(res.body.L_SystemPrice).toBe(3950000);
    expect(res.body.L_Keyword2).toBe(4);
    expect(Array.isArray(res.body.photos)).toBe(true);
  });

  it("returns 404 with a helpful message for an unknown ID", async () => {
    const res = await request(app).get("/api/properties/9999999999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Property not found");
    expect(res.body.message).toContain("9999999999");
  });

  it.each([
    ["abc", "non-numeric"],
    ["111abc", "partially numeric"],
    ["1.5", "decimal"],
    ["111 842", "embedded space"],
    ["1e5", "scientific notation"],
    ["123456789012345678901", "oversized"],
  ])("returns 400 for a malformed ID (%s = %s)", async (id) => {
    const res = await request(app).get(`/api/properties/${id}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it("DEBUG: handles a listing whose L_Photos is an empty string", async () => {
    // 1118398412 has L_Photos = '' (PhotoCount 0), which is not valid JSON.
    // An unguarded JSON.parse throws "Unexpected end of JSON input".
    const [[row]] = await pool.query(
      "SELECT L_ListingID, L_Photos FROM rets_property WHERE L_ListingID = ?",
      ["1118398412"]
    );
    expect(row).toBeDefined();
    expect(row.L_Photos).toBe("");

    const res = await request(app).get("/api/properties/1118398412");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.photos)).toBe(true);
    expect(res.body.photos).toEqual([]);
  });

  it("returns 200 with an empty photo array for every listing that has no photos", async () => {
    const [rows] = await pool.query(
      "SELECT L_ListingID FROM rets_property WHERE L_Photos = '' OR L_Photos IS NULL LIMIT 5"
    );
    expect(rows.length).toBeGreaterThan(0);

    for (const { L_ListingID } of rows) {
      const res = await request(app).get(`/api/properties/${L_ListingID}`);
      expect(res.status).toBe(200);
      expect(res.body.photos).toEqual([]);
    }
  });
});

describe("GET /api/properties/:id/openhouses", () => {
  it("returns open houses for a property that has them", async () => {
    const res = await request(app).get("/api/properties/1178585070/openhouses");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.openHouses)).toBe(true);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it("returns an empty array (200, not an error) for a property with none", async () => {
    const res = await request(app).get("/api/properties/1118422731/openhouses");
    expect(res.status).toBe(200);
    expect(res.body.openHouses).toEqual([]);
    expect(res.body.count).toBe(0);
  });

  it("orders open houses by date then start time", async () => {
    const [[row]] = await pool.query(
      `SELECT oh.L_ListingID FROM rets_openhouse oh
       JOIN rets_property p ON oh.L_ListingID = p.L_ListingID
       GROUP BY oh.L_ListingID ORDER BY COUNT(*) DESC, COUNT(DISTINCT oh.OpenHouseDate) DESC LIMIT 1`
    );

    expect(row).toBeDefined();

    const res = await request(app).get(
      `/api/properties/${row.L_ListingID}/openhouses`
    );
    expect(res.status).toBe(200);

    const sorted = [...res.body.openHouses].sort((a, b) => {
      const byDate = new Date(a.OpenHouseDate) - new Date(b.OpenHouseDate);
      if (byDate !== 0) return byDate;
      return a.OH_StartTime.localeCompare(b.OH_StartTime);
    });

    expect(res.body.openHouses).toEqual(sorted);
  });

  it("returns 404 when the property does not exist", async () => {
    const res = await request(app).get("/api/properties/9999999999/openhouses");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Property not found");
  });

  it("returns 400 for a malformed ID", async () => {
    const res = await request(app).get("/api/properties/not-a-number/openhouses");
    expect(res.status).toBe(400);
  });

  it("route order: /openhouses is not swallowed by /:id", async () => {
    // If /:id were registered first, id would capture "1178585070/openhouses"
    // and the response would be a 404 property response, not open houses.
    const res = await request(app).get("/api/properties/1178585070/openhouses");
    expect(res.body.openHouses).toBeDefined();
    expect(res.body.L_ListingID).toBeUndefined();
  });

  it("returns all_data as-is without parsing it in the backend", async () => {
    const res = await request(app).get("/api/properties/1178585070/openhouses");
    const first = res.body.openHouses[0];
    expect(typeof first.all_data).toBe("string");
    expect(() => JSON.parse(first.all_data)).not.toThrow();
  });
});

describe("validateListingId", () => {
  it("accepts a normal ID", () => {
    expect(validateListingId("1118422731")).toEqual({ listingId: "1118422731" });
  });

  it.each(["", "abc", "-1", "1.5", "1e5", "111 842", "١٢٣", "x".repeat(21)])(
    "rejects %p",
    (bad) => {
      expect(validateListingId(bad).error).toBeTruthy();
    }
  );

  it("accepts exactly 20 digits", () => {
    expect(validateListingId("1".repeat(20)).listingId).toBeTruthy();
  });
});