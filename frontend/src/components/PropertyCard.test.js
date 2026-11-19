import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import PropertyCard from "./PropertyCard";
import {
  FAVORITES_STORAGE_KEY,
  clearFavorites,
  isFavorite,
  toggleFavorite,
} from "../hooks/useFavorites";

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

function renderCard(property = baseProperty) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <PropertyCard property={property} />
    </MemoryRouter>
  );
}

describe("PropertyCard", () => {
  it("links to the property detail route", () => {
    renderCard();

    expect(
      screen.getByRole("link", { name: /view details for 1461 Laurel Way/i })
    ).toHaveAttribute("href", "/property/1118422731");
  });

  it("renders the price, address and location", () => {
    renderCard();

    expect(screen.getByText("$3,950,000")).toBeInTheDocument();
    expect(screen.getByText("1461 Laurel Way")).toBeInTheDocument();
    expect(screen.getByText("Beverly Hills, CA 90210")).toBeInTheDocument();
  });

  it("renders beds, baths and sqft", () => {
    renderCard();

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3,677")).toBeInTheDocument();
    expect(screen.getByText("beds")).toBeInTheDocument();
    expect(screen.getByText("baths")).toBeInTheDocument();
    expect(screen.getByText("sqft")).toBeInTheDocument();
  });

  it("shows the first photo parsed from the L_Photos JSON array", () => {
    renderCard();

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/1.jpg"
    );
  });

  it("shows a placeholder instead of an image when L_Photos is empty", () => {
    renderCard({ ...baseProperty, L_Photos: "" });

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("No photo available")).toBeInTheDocument();
  });

  it("does not crash when L_Photos is malformed JSON", () => {
    expect(() =>
      renderCard({ ...baseProperty, L_Photos: "{not json" })
    ).not.toThrow();

    expect(screen.getByText("No photo available")).toBeInTheDocument();
  });

  it("does not crash when L_Photos is null", () => {
    expect(() => renderCard({ ...baseProperty, L_Photos: null })).not.toThrow();
  });

  it("does not crash when the photo array contains non-string entries", () => {
    const raw = JSON.stringify([42, null, "https://example.com/3.jpg"]);
    renderCard({ ...baseProperty, L_Photos: raw });

    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      "https://example.com/3.jpg"
    );
  });

  it("falls back gracefully when price is missing", () => {
    renderCard({
      ...baseProperty,
      L_SystemPrice: null,
      L_Keyword2: null,
      LM_Int2_3: null,
    });

    expect(screen.getByText("Price unavailable")).toBeInTheDocument();
  });

  it("shows the status badge", () => {
    renderCard();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  describe("favorite heart", () => {
    beforeEach(() => {
      window.localStorage.clear();
      clearFavorites();
    });

    function renderWithPathSpy(property = baseProperty) {
      function PathSpy() {
        const location = useLocation();
        return <span data-testid="path">{location.pathname}</span>;
      }

      return render(
        <MemoryRouter
          initialEntries={["/"]}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <PropertyCard property={property} />
          <PathSpy />
        </MemoryRouter>
      );
    }

    it("shows an empty heart for a property that is not saved", () => {
      renderCard();

      const heart = screen.getByRole("button", {
        name: /save 1461 Laurel Way to favorites/i,
      });
      expect(heart).toHaveAttribute("aria-pressed", "false");
      expect(heart).toHaveTextContent("♡");
    });

    it("fills the heart and saves the property when clicked", async () => {
      renderCard();

      await userEvent.click(
        screen.getByRole("button", { name: /save 1461 Laurel Way to favorites/i })
      );

      const heart = screen.getByRole("button", {
        name: /remove 1461 Laurel Way from favorites/i,
      });
      expect(heart).toHaveAttribute("aria-pressed", "true");
      expect(heart).toHaveTextContent("♥");
      expect(isFavorite("1118422731")).toBe(true);
      expect(window.localStorage.getItem(FAVORITES_STORAGE_KEY)).toContain(
        "1118422731"
      );
    });

    it("does not navigate to the property when the heart is clicked", async () => {
      renderWithPathSpy();

      expect(screen.getByTestId("path")).toHaveTextContent("/");

      await userEvent.click(
        screen.getByRole("button", { name: /save 1461 Laurel Way to favorites/i })
      );

      expect(screen.getByTestId("path")).toHaveTextContent("/");
      expect(
        screen.getByRole("link", { name: /view details for 1461 Laurel Way/i })
      ).toHaveAttribute("href", "/property/1118422731");
    });

    it("unfavorites on a second click", async () => {
      renderCard();

      const heart = screen.getByRole("button", {
        name: /save 1461 Laurel Way to favorites/i,
      });
      await userEvent.click(heart);
      await userEvent.click(
        screen.getByRole("button", { name: /remove 1461 Laurel Way from favorites/i })
      );

      expect(isFavorite("1118422731")).toBe(false);
      expect(
        screen.getByRole("button", { name: /save 1461 Laurel Way to favorites/i })
      ).toHaveAttribute("aria-pressed", "false");
    });

    it("starts filled for a property saved on an earlier visit", () => {
      toggleFavorite(baseProperty);

      renderCard();

      expect(
        screen.getByRole("button", { name: /remove 1461 Laurel Way from favorites/i })
      ).toHaveAttribute("aria-pressed", "true");
    });
  });
});
