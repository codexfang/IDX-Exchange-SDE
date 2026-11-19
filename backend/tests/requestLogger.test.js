const express = require("express");
const request = require("supertest");
const requestLogger = require("../src/middleware/requestLogger");

// Build a tiny app so the test never touches the database.
function buildApp() {
  const app = express();
  app.use(requestLogger);
  app.get("/ok", (req, res) => res.json({ ok: true }));
  app.get("/boom", (req, res) => res.status(500).json({ error: "boom" }));
  return app;
}

describe("requestLogger", () => {
  let logSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function loggedLines() {
    return logSpy.mock.calls.map((call) => call.join(" "));
  }

  it("logs method, url, status and a millisecond duration", async () => {
    await request(buildApp()).get("/ok?city=Irvine");

    const lines = loggedLines();
    expect(lines).toHaveLength(1);
    // Shape: "GET /ok?city=Irvine 200 3.47ms"
    expect(lines[0]).toMatch(/^GET \/ok\?city=Irvine 200 \d+\.\d{2}ms$/);
  });

  it("still logs when the handler fails", async () => {
    await request(buildApp()).get("/boom");

    const lines = loggedLines();
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^GET \/boom 500 \d+\.\d{2}ms$/);
  });

  it("logs unmatched routes with their 404 status", async () => {
    await request(buildApp()).get("/missing");

    expect(loggedLines()[0]).toMatch(/^GET \/missing 404 \d+\.\d{2}ms$/);
  });

  it("reports a plausible duration for a slow handler", async () => {
    const app = express();
    app.use(requestLogger);
    app.get("/slow", (req, res) => {
      setTimeout(() => res.json({ ok: true }), 60);
    });

    await request(app).get("/slow");

    const duration = parseFloat(loggedLines()[0].match(/(\d+\.\d{2})ms$/)[1]);
    expect(duration).toBeGreaterThanOrEqual(50);
    expect(duration).toBeLessThan(2000);
  });
});
