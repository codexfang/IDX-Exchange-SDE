import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import FavoritesPage from "./FavoritesPage";
import { clearFavorites, getFavorites, toggleFavorite } from "../hooks/useFavorites";

const lauralWay = {
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
  L_Photos: JSON.stringify(["https://example.com/1.jpg"]),
};

const pastureAve = {
  ...lauralWay,
  id: 2,
  L_ListingID: "1118422732",
  L_Address: "582 Pasture Ave",
  L_City: "Lathrop",
  L_SystemPrice: 775000,
};

function renderFavorites() {
  return render(
    <MemoryRouter>
      <FavoritesPage />
    </MemoryRouter>
  );
}

describe("FavoritesPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearFavorites();
  });

  it("shows an empty state with a way back to the listings", () => {
    renderFavorites();

    expect(screen.getByText("No saved properties yet")).toBeInTheDocument();
    expect(
      screen.getByText("You have not saved any properties")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /browse properties/i })
    ).toHaveAttribute("href", "/");
  });

  it("lists the saved properties", () => {
    toggleFavorite(lauralWay);
    toggleFavorite(pastureAve);

    renderFavorites();

    expect(screen.getByText("2 saved properties")).toBeInTheDocument();
    expect(screen.getByText("1461 Laurel Way")).toBeInTheDocument();
    expect(screen.getByText("582 Pasture Ave")).toBeInTheDocument();
    expect(screen.getByText("$775,000")).toBeInTheDocument();
  });

  it("uses the singular when only one property is saved", () => {
    toggleFavorite(lauralWay);

    renderFavorites();

    expect(screen.getByText("1 saved property")).toBeInTheDocument();
  });

  it("removes a property from the view immediately when unfavorited", async () => {
    toggleFavorite(lauralWay);
    toggleFavorite(pastureAve);

    renderFavorites();
    expect(screen.getByText("1461 Laurel Way")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /remove 1461 Laurel Way from favorites/i })
    );

    expect(screen.queryByText("1461 Laurel Way")).not.toBeInTheDocument();
    expect(screen.getByText("582 Pasture Ave")).toBeInTheDocument();
    expect(screen.getByText("1 saved property")).toBeInTheDocument();
    expect(getFavorites().map((entry) => entry.id)).toEqual(["1118422732"]);
  });

  it("falls back to the empty state when the last favorite is removed", async () => {
    toggleFavorite(lauralWay);

    renderFavorites();

    await userEvent.click(
      screen.getByRole("button", { name: /remove 1461 Laurel Way from favorites/i })
    );

    expect(screen.getByText("No saved properties yet")).toBeInTheDocument();
    expect(screen.queryByText("1461 Laurel Way")).not.toBeInTheDocument();
  });

  it("links each saved property to its detail page", () => {
    toggleFavorite(lauralWay);

    renderFavorites();

    expect(
      screen.getByRole("link", { name: /view details for 1461 Laurel Way/i })
    ).toHaveAttribute("href", "/property/1118422731");
  });
});
