import { parsePhotos, firstPhoto } from "./photos";

describe("parsePhotos", () => {
  it("parses a valid JSON array of URLs", () => {
    const raw = JSON.stringify([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
    ]);
    expect(parsePhotos(raw)).toEqual([
      "https://example.com/1.jpg",
      "https://example.com/2.jpg",
    ]);
  });

  it("returns an empty array for an empty string", () => {
    // 211 real rows in rets_property have L_Photos = ''
    expect(parsePhotos("")).toEqual([]);
  });

  it("returns an empty array for a whitespace-only string", () => {
    expect(parsePhotos("   ")).toEqual([]);
  });

  it("returns an empty array for null and undefined", () => {
    expect(parsePhotos(null)).toEqual([]);
    expect(parsePhotos(undefined)).toEqual([]);
  });

  it("returns an empty array for malformed JSON without throwing", () => {
    expect(() => parsePhotos("{not json")).not.toThrow();
    expect(parsePhotos("{not json")).toEqual([]);
    expect(parsePhotos("[unclosed")).toEqual([]);
    expect(parsePhotos("undefined")).toEqual([]);
  });

  it("returns an empty array for valid JSON that is not an array", () => {
    expect(parsePhotos('{"url":"https://example.com/1.jpg"}')).toEqual([]);
    expect(parsePhotos('"https://example.com/1.jpg"')).toEqual([]);
    expect(parsePhotos("42")).toEqual([]);
    expect(parsePhotos("null")).toEqual([]);
    expect(parsePhotos("true")).toEqual([]);
  });

  it("filters out non-string entries", () => {
    const raw = JSON.stringify([
      "https://example.com/1.jpg",
      42,
      null,
      { url: "https://example.com/2.jpg" },
      "https://example.com/3.jpg",
    ]);
    expect(parsePhotos(raw)).toEqual([
      "https://example.com/1.jpg",
      "https://example.com/3.jpg",
    ]);
  });

  it("filters out empty strings inside the array", () => {
    const raw = JSON.stringify(["", "  ", "https://example.com/1.jpg"]);
    expect(parsePhotos(raw)).toEqual(["https://example.com/1.jpg"]);
  });

  it("handles an already-parsed array", () => {
    expect(parsePhotos(["https://example.com/1.jpg"])).toEqual([
      "https://example.com/1.jpg",
    ]);
  });

  it("returns an empty array for a non-string, non-array value", () => {
    expect(parsePhotos(12345)).toEqual([]);
    expect(parsePhotos(true)).toEqual([]);
  });
});

describe("firstPhoto", () => {
  it("returns the first URL", () => {
    const raw = JSON.stringify(["https://example.com/1.jpg", "https://example.com/2.jpg"]);
    expect(firstPhoto(raw)).toBe("https://example.com/1.jpg");
  });

  it("returns null when there is no photo", () => {
    expect(firstPhoto("")).toBeNull();
    expect(firstPhoto(null)).toBeNull();
    expect(firstPhoto("{bad json")).toBeNull();
    expect(firstPhoto("[]")).toBeNull();
  });
});
