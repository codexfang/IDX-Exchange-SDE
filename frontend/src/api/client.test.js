import { ApiError, fetchProperties } from "./client";

describe("api client", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("requests the properties endpoint with query params", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ total: 1, results: [] }),
    });

    await fetchProperties({ city: "Irvine", limit: 20 });

    const [url] = global.fetch.mock.calls[0];
    expect(url).toContain("/api/properties");
    expect(url).toContain("city=Irvine");
    expect(url).toContain("limit=20");
  });

  it("omits empty params from the query string", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ total: 0, results: [] }),
    });

    await fetchProperties({ city: "", minPrice: undefined, limit: 20 });

    const [url] = global.fetch.mock.calls[0];
    expect(url).not.toContain("city=");
    expect(url).not.toContain("minPrice");
  });

  it("throws a helpful message when the server is unreachable", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchProperties()).rejects.toThrow(
      /could not reach the server/i
    );
  });

  it("surfaces 400 validation details as the error message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({
          error: "Invalid query parameters",
          details: ["limit must be 100 or less"],
        }),
    });

    await expect(fetchProperties({ limit: 200 })).rejects.toThrow(
      "limit must be 100 or less"
    );
  });

  it("surfaces the 404 message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: async () =>
        JSON.stringify({
          error: "Property not found",
          message: "No property exists with listing ID 999",
        }),
    });

    await expect(fetchProperties({ id: 999 })).rejects.toThrow(
      "No property exists with listing ID 999"
    );
  });

  it("throws an ApiError carrying the status code", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: "Internal server error" }),
    });

    try {
      await fetchProperties();
      throw new Error("expected a rejection");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(500);
    }
  });

  it("gives an actionable message when the API returns a 5xx", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ error: "Internal server error" }),
    });

    await expect(fetchProperties()).rejects.toThrow(
      /express server running on port 5000/i
    );
  });
});
