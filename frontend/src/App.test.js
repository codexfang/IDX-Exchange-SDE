import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { fetchOpenHouses, fetchProperties, fetchPropertyDetail } from "./api/client";
import { clearFavorites, FAVORITES_STORAGE_KEY } from "./hooks/useFavorites";

jest.mock("./api/client");

const listing = {
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

describe("App routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    clearFavorites();
    window.history.pushState({}, "", "/");
    fetchProperties.mockResolvedValue({
      total: 1,
      limit: 20,
      offset: 0,
      results: [listing],
    });
    fetchPropertyDetail.mockResolvedValue({
      ...listing,
      L_Remarks: "A stunning hillside home.",
      L_Photos: JSON.stringify(["https://example.com/1.jpg"]),
    });
    fetchOpenHouses.mockResolvedValue({ count: 0, openHouses: [] });
  });

  it("renders the listings page at /", async () => {
    render(<App />);

    expect(await screen.findByText("1461 Laurel Way")).toBeInTheDocument();
    expect(screen.getByText("Property Listings")).toBeInTheDocument();
  });

  it("navigates from a card to the detail page and back", async () => {
    render(<App />);

    await screen.findByText("1461 Laurel Way");
    await userEvent.click(
      screen.getByRole("link", { name: /view details for 1461 Laurel Way/i })
    );

    expect(await screen.findByText("A stunning hillside home.")).toBeInTheDocument();
    expect(fetchPropertyDetail).toHaveBeenCalledWith("1118422731");
    expect(screen.queryByText("Property Listings")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("link", { name: /back to listings/i }));

    expect(await screen.findByText("Property Listings")).toBeInTheDocument();
  });

  it("renders the favorites page at /favorites", async () => {
    window.history.pushState({}, "", "/favorites");

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Favorites" })
    ).toBeInTheDocument();
    expect(screen.getByText("No saved properties yet")).toBeInTheDocument();
  });

  it("shows a property saved from the listings page in favorites", async () => {
    render(<App />);
    await screen.findByText("1461 Laurel Way");

    await userEvent.click(
      screen.getByRole("button", { name: /save 1461 Laurel Way to favorites/i })
    );
    await userEvent.click(
      screen.getByRole("link", { name: /view favorites, 1 saved/i })
    );

    expect(
      await screen.findByRole("heading", { name: "Favorites" })
    ).toBeInTheDocument();
    expect(screen.getByText("1 saved property")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view details for 1461 Laurel Way/i })
    ).toHaveAttribute("href", "/property/1118422731");
  });

  it("writes a favorite to localStorage so it survives a reload", async () => {
    render(<App />);
    await screen.findByText("1461 Laurel Way");

    await userEvent.click(
      screen.getByRole("button", { name: /save 1461 Laurel Way to favorites/i })
    );

    const stored = JSON.parse(window.localStorage.getItem(FAVORITES_STORAGE_KEY));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("1118422731");
    expect(stored[0].property.L_Address).toBe("1461 Laurel Way");
  });
});
