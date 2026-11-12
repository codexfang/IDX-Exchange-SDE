import React from "react";
import { render, screen } from "@testing-library/react";
import PropertyMap from "./PropertyMap";

const originalKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function useKey(value) {
  if (value === undefined) {
    delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  } else {
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY = value;
  }
}

afterEach(() => {
  useKey(originalKey);
});

describe("PropertyMap", () => {
  beforeEach(() => {
    useKey("test-key");
  });

  it("renders a Maps Embed iframe for the property coordinates", () => {
    render(
      <PropertyMap
        latitude={34.0736}
        longitude={-118.4004}
        address="1461 Laurel Way"
      />
    );

    const frame = screen.getByTitle("Map of 1461 Laurel Way");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame.getAttribute("src")).toContain(
      "https://www.google.com/maps/embed/v1/place"
    );
    expect(frame.getAttribute("src")).toContain("key=test-key");
    expect(frame.getAttribute("src")).toContain("q=34.0736,-118.4004");
    expect(frame.getAttribute("src")).toContain("zoom=15");
  });

  it("accepts coordinates that arrive as strings", () => {
    render(<PropertyMap latitude="34.0736" longitude="-118.4004" address="Home" />);

    expect(screen.getByTitle("Map of Home").getAttribute("src")).toContain(
      "q=34.0736,-118.4004"
    );
  });

  it("renders nothing when latitude is missing", () => {
    const { container } = render(
      <PropertyMap latitude={null} longitude={-118.4004} address="Home" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when longitude is missing", () => {
    const { container } = render(
      <PropertyMap latitude={34.0736} longitude="" address="Home" />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("links Get Directions to Google Maps in a new tab", () => {
    render(
      <PropertyMap latitude={34.0736} longitude={-118.4004} address="Home" />
    );

    const link = screen.getByRole("link", { name: "Get Directions" });
    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=34.0736,-118.4004"
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("explains the missing API key instead of rendering a broken iframe", () => {
    useKey(undefined);

    render(<PropertyMap latitude={34.0736} longitude={-118.4004} address="Home" />);

    expect(screen.queryByTitle("Map of Home")).not.toBeInTheDocument();
    expect(screen.getByText(/REACT_APP_GOOGLE_MAPS_API_KEY/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get Directions" })).toBeInTheDocument();
  });
});
