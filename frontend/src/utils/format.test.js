import {
  formatClockTime,
  formatOpenHouseDate,
  formatPrice,
  formatTimeRange,
} from "./format";

describe("formatOpenHouseDate", () => {
  it("formats an ISO timestamp without shifting the calendar day", () => {
    expect(formatOpenHouseDate("2024-05-04T00:00:00.000Z")).toBe(
      "Saturday, May 4, 2024"
    );
  });

  it("formats a Date object using its local calendar day", () => {
    expect(formatOpenHouseDate(new Date(2024, 4, 4))).toBe("Saturday, May 4, 2024");
  });

  it("returns an empty string for missing dates", () => {
    expect(formatOpenHouseDate(null)).toBe("");
  });
});

describe("formatClockTime", () => {
  it("converts 24-hour times to 12-hour clock times", () => {
    expect(formatClockTime("13:00:00")).toBe("1:00 PM");
    expect(formatClockTime("09:30:00")).toBe("9:30 AM");
    expect(formatClockTime("00:15:00")).toBe("12:15 AM");
    expect(formatClockTime("12:00:00")).toBe("12:00 PM");
  });

  it("builds a time range", () => {
    expect(formatTimeRange("13:00:00", "16:00:00")).toBe("1:00 PM – 4:00 PM");
  });

  it("falls back to the start time when there is no end time", () => {
    expect(formatTimeRange("13:00:00", null)).toBe("1:00 PM");
  });
});

describe("formatPrice", () => {
  it("adds thousands separators", () => {
    expect(formatPrice(3950000)).toBe("$3,950,000");
  });

  it("handles missing prices", () => {
    expect(formatPrice(null)).toBe("Price unavailable");
    expect(formatPrice("not a number")).toBe("Price unavailable");
  });
});
