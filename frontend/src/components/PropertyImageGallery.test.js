import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PropertyImageGallery from "./PropertyImageGallery";

const photos = JSON.stringify([
  "https://example.com/1.jpg",
  "https://example.com/2.jpg",
  "https://example.com/3.jpg",
]);

function renderGallery(overrides = {}) {
  return render(
    <PropertyImageGallery photos={photos} alt="1461 Laurel Way" {...overrides} />
  );
}

function openLightbox() {
  fireEvent.click(
    screen.getByRole("button", { name: /open full-screen photo/i })
  );
  return screen.getByRole("dialog");
}

describe("PropertyImageGallery", () => {
  it("parses L_Photos and shows the first photo as the main image", () => {
    renderGallery();

    expect(
      screen.getByAltText("1461 Laurel Way — view 1")
    ).toHaveAttribute("src", "https://example.com/1.jpg");
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("renders a thumbnail for every photo", () => {
    renderGallery();

    expect(screen.getAllByRole("button", { name: /show photo/i })).toHaveLength(3);
  });

  it("updates the main image when a thumbnail is clicked", () => {
    renderGallery();

    fireEvent.click(screen.getByRole("button", { name: "Show photo 3" }));

    expect(
      screen.getByAltText("1461 Laurel Way — view 3")
    ).toHaveAttribute("src", "https://example.com/3.jpg");
  });

  it("opens a full-screen lightbox when the main image is clicked", () => {
    renderGallery();

    const dialog = openLightbox();

    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByAltText("1461 Laurel Way — full-screen view 1")
    ).toBeInTheDocument();
  });

  it("moves focus into the lightbox so it can receive keyboard events", () => {
    renderGallery();

    const dialog = openLightbox();

    // A plain div is not focusable: without tabIndex the keydown listener on it
    // never fires because focus stays on <body>.
    expect(dialog).toHaveFocus();
  });

  it("closes the lightbox when Escape is pressed", () => {
    renderGallery();

    const dialog = openLightbox();
    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("navigates photos with the arrow keys while the lightbox is open", () => {
    renderGallery();

    const dialog = openLightbox();
    fireEvent.keyDown(dialog, { key: "ArrowRight" });

    expect(
      screen.getByAltText("1461 Laurel Way — full-screen view 2")
    ).toBeInTheDocument();

    fireEvent.keyDown(dialog, { key: "ArrowLeft" });
    expect(
      screen.getByAltText("1461 Laurel Way — full-screen view 1")
    ).toBeInTheDocument();
  });

  it("closes the lightbox when clicking outside the photo", () => {
    renderGallery();

    const dialog = openLightbox();
    fireEvent.click(dialog);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close the lightbox when clicking the photo itself", () => {
    renderGallery();

    openLightbox();
    fireEvent.click(
      screen.getByAltText("1461 Laurel Way — full-screen view 1")
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the lightbox with the close button", () => {
    renderGallery();

    openLightbox();
    fireEvent.click(screen.getByRole("button", { name: "Close photo viewer" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a placeholder for a property with no photos", () => {
    renderGallery({ photos: "" });

    expect(screen.getByText("No photo available")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /open full-screen photo/i })
    ).not.toBeInTheDocument();
  });

  it("does not crash when L_Photos is malformed JSON", () => {
    expect(() => renderGallery({ photos: "{not json" })).not.toThrow();
    expect(screen.getByText("No photo available")).toBeInTheDocument();
  });

  it("shows a single photo without a thumbnail strip", () => {
    renderGallery({ photos: JSON.stringify(["https://example.com/only.jpg"]) });

    expect(
      screen.getByAltText("1461 Laurel Way — view 1")
    ).toHaveAttribute("src", "https://example.com/only.jpg");
    expect(
      screen.queryByRole("group", { name: "Photo thumbnails" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });
});
