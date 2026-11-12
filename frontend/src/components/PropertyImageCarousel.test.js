import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import PropertyImageCarousel from "./PropertyImageCarousel";

const photos = JSON.stringify([
  "https://example.com/1.jpg",
  "https://example.com/2.jpg",
  "https://example.com/3.jpg",
]);

describe("PropertyImageCarousel", () => {
  it("shows the first photo and a photo counter", () => {
    render(<PropertyImageCarousel photos={photos} alt="1461 Laurel Way" />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/1.jpg"
    );
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("cycles forward and wraps around to the first photo", () => {
    render(<PropertyImageCarousel photos={photos} alt="1461 Laurel Way" />);

    const next = screen.getByRole("button", { name: "Next photo" });

    fireEvent.click(next);
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/2.jpg"
    );
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    fireEvent.click(next);
    fireEvent.click(next);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("cycles backward and wraps around to the last photo", () => {
    render(<PropertyImageCarousel photos={photos} alt="1461 Laurel Way" />);

    fireEvent.click(screen.getByRole("button", { name: "Previous photo" }));

    expect(screen.getByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/3.jpg"
    );
  });

  it("hides the arrows for a single-photo property", () => {
    render(
      <PropertyImageCarousel
        photos={JSON.stringify(["https://example.com/only.jpg"])}
        alt="Single"
      />
    );

    expect(
      screen.queryByRole("button", { name: "Next photo" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("shows a placeholder and no crash for malformed L_Photos", () => {
    expect(() =>
      render(<PropertyImageCarousel photos="{not json" alt="Broken" />)
    ).not.toThrow();

    expect(screen.getByText("No photo available")).toBeInTheDocument();
  });

  it("does not navigate when an arrow is clicked inside a card link", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={
              <Link to="/property/1118422731">
                <PropertyImageCarousel photos={photos} alt="1461 Laurel Way" />
              </Link>
            }
          />
          <Route path="/property/:id" element={<p>Detail page</p>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Next photo" }));

    expect(screen.queryByText("Detail page")).not.toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });
});
