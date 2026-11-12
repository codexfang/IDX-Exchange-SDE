import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { fetchOpenHouses, fetchProperties, fetchPropertyDetail } from "./api/client";

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
});
