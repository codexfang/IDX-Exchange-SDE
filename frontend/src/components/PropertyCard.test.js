import React from "react";
import { render, screen } from "@testing-library/react";
import PropertyCard from "./PropertyCard";

const baseProperty = {
  id: 1,
  L_ListingID: "1118422731",
  L_Address: "1461 Laurel Way",
  L_City: "Beverly Hills",
  L_State: "CA",
  L_Zip: "90210",
  L_SystemPrice: 3950000,
  L_Keyword2: 4,
  LM_Dec_3: "5.0",
  LM_Int2_3: 3677,
  L_Status: "Active",
  L_Photos: JSON.stringify(["https://example.com/1.jpg", "https://example.com/2.jpg"]),
};

describe("PropertyCard", () => {
  it("renders the price, address and location", () => {
    render(<PropertyCard property={baseProperty} />);

    expect(screen.getByText("$3,950,000")).toBeInTheDocument();
    expect(screen.getByText("1461 Laurel Way")).toBeInTheDocument();
    expect(screen.getByText("Beverly Hills, CA 90210")).toBeInTheDocument();
  });

  it("renders beds, baths and sqft", () => {
    render(<PropertyCard property={baseProperty} />);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3,677")).toBeInTheDocument();
    expect(screen.getByText("beds")).toBeInTheDocument();
    expect(screen.getByText("baths")).toBeInTheDocument();
    expect(screen.getByText("sqft")).toBeInTheDocument();
  });

  it("shows the first photo parsed from the L_Photos JSON array", () => {
    render(<PropertyCard property={baseProperty} />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/1.jpg");
  });

  it("shows a placeholder instead of an image when L_Photos is empty", () => {
    render(<PropertyCard property={{ ...baseProperty, L_Photos: "" }} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("No photo available")).toBeInTheDocument();
  });

  it("does not crash when L_Photos is malformed JSON", () => {
    expect(() =>
      render(<PropertyCard property={{ ...baseProperty, L_Photos: "{not json" }} />)
    ).not.toThrow();

    expect(screen.getByText("No photo available")).toBeInTheDocument();
  });

  it("does not crash when L_Photos is null", () => {
    expect(() =>
      render(<PropertyCard property={{ ...baseProperty, L_Photos: null }} />)
    ).not.toThrow();
  });

  it("does not crash when the photo array contains non-string entries", () => {
    const raw = JSON.stringify([42, null, "https://example.com/3.jpg"]);
    render(<PropertyCard property={{ ...baseProperty, L_Photos: raw }} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/3.jpg"
    );
  });

  it("falls back gracefully when price is missing", () => {
    render(
      <PropertyCard
        property={{ ...baseProperty, L_SystemPrice: null, L_Keyword2: null, LM_Int2_3: null }}
      />
    );

    expect(screen.getByText("Price unavailable")).toBeInTheDocument();
  });

  it("shows the status badge", () => {
    render(<PropertyCard property={baseProperty} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
