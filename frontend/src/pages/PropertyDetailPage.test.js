import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import PropertyDetailPage from "./PropertyDetailPage";
import { fetchOpenHouses, fetchPropertyDetail } from "../api/client";

jest.mock("../api/client");

const detail = {
  L_ListingID: "1118422731",
  L_DisplayId: "OC24000001",
  L_Address: "1461 Laurel Way",
  L_City: "Beverly Hills",
  L_State: "CA",
  L_Zip: "90210",
  L_SystemPrice: 3950000,
  L_Keyword2: 4,
  LM_Dec_3: "5.0",
  LM_Int2_3: 3677,
  YearBuilt: 1998,
  L_Status: "Active",
  L_Remarks: "A stunning hillside home with panoramic views.",
  L_Type_: "Residential",
  SubdivisionName: "Laurel Hills",
  Cooling: "Central Air",
  Heating: "Forced Air",
  LotSizeAcres: "0.53",
  DaysOnMarket: 12,
  ListAgentFullName: "Jane Doe",
  LO1_OrganizationName: "Acme Realty",
  LMD_MP_Latitude: 34.0736,
  LMD_MP_Longitude: -118.4004,
  L_Photos: JSON.stringify([
    "https://example.com/1.jpg",
    "https://example.com/2.jpg",
  ]),
};

const openHouse = {
  id: 7,
  OpenHouseDate: "2024-05-04T00:00:00.000Z",
  OH_StartTime: "13:00:00",
  OH_EndTime: "16:00:00",
  all_data: JSON.stringify({ OpenHouseRemarks: "Refreshments provided." }),
};

function renderDetail(id = "1118422731") {
  return render(
    <MemoryRouter
      initialEntries={[`/property/${id}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/property/:id" element={<PropertyDetailPage />} />
        <Route path="/" element={<p>Listings page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PropertyDetailPage", () => {
  const originalKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY = "test-key";
    fetchPropertyDetail.mockResolvedValue(detail);
    fetchOpenHouses.mockResolvedValue({ count: 1, openHouses: [openHouse] });
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    else process.env.REACT_APP_GOOGLE_MAPS_API_KEY = originalKey;
  });

  it("shows a loading state first", async () => {
    renderDetail();
    expect(screen.getByText(/loading property/i)).toBeInTheDocument();

    // The mocked requests resolve a tick later. Waiting for the loaded page
    // keeps that state update inside the test's async act(), which is what
    // silences React's "not wrapped in act(...)" warning.
    expect(await screen.findByText("$3,950,000")).toBeInTheDocument();
  });

  it("renders the price, address and location", async () => {
    renderDetail();

    expect(await screen.findByText("$3,950,000")).toBeInTheDocument();
    expect(screen.getByText("1461 Laurel Way")).toBeInTheDocument();
    expect(screen.getByText("Beverly Hills, CA 90210")).toBeInTheDocument();
  });

  it("renders beds, baths, square footage and year built", async () => {
    renderDetail();

    await screen.findByText("$3,950,000");

    expect(screen.getByText("Beds").nextSibling).toHaveTextContent("4");
    expect(screen.getByText("Baths").nextSibling).toHaveTextContent("5");
    expect(screen.getByText("Sq Ft").nextSibling).toHaveTextContent("3,677");
    expect(screen.getByText("Year built").nextSibling).toHaveTextContent("1998");
  });

  it("renders the description and property details", async () => {
    renderDetail();

    expect(
      await screen.findByText("A stunning hillside home with panoramic views.")
    ).toBeInTheDocument();
    expect(screen.getByText("Residential")).toBeInTheDocument();
    expect(screen.getByText("Laurel Hills")).toBeInTheDocument();
    expect(screen.getByText("Central Air")).toBeInTheDocument();
    expect(screen.getByText("Acme Realty")).toBeInTheDocument();
  });

  it("parses L_Photos into the gallery", async () => {
    renderDetail();

    expect(
      await screen.findByAltText("1461 Laurel Way — view 1")
    ).toHaveAttribute("src", "https://example.com/1.jpg");
  });

  it("renders the map at the property coordinates", async () => {
    renderDetail();

    const frame = await screen.findByTitle("Map of 1461 Laurel Way");
    expect(frame.getAttribute("src")).toContain("q=34.0736,-118.4004");
  });

  it("shows open house remarks from all_data", async () => {
    renderDetail();

    expect(await screen.findByText("Refreshments provided.")).toBeInTheDocument();
    expect(screen.getByText("Saturday, May 4, 2024")).toBeInTheDocument();
  });

  it("says so when there are no open houses", async () => {
    fetchOpenHouses.mockResolvedValue({ count: 0, openHouses: [] });

    renderDetail();

    expect(await screen.findByText("No open houses scheduled")).toBeInTheDocument();
  });

  it("keeps the page usable when only the open house request fails", async () => {
    fetchOpenHouses.mockRejectedValue(new Error("Internal server error"));

    renderDetail();

    expect(await screen.findByText("$3,950,000")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("No open houses scheduled")).toBeInTheDocument()
    );
  });

  it("shows an error for an unknown listing instead of crashing", async () => {
    fetchPropertyDetail.mockRejectedValue(
      new Error("No property exists with listing ID 9999999999")
    );

    renderDetail("9999999999");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not load this property/i
    );
    expect(
      screen.getByText("No property exists with listing ID 9999999999")
    ).toBeInTheDocument();
  });

  it("shows an error for a malformed listing id", async () => {
    fetchPropertyDetail.mockRejectedValue(
      new Error("Listing ID must contain only digits")
    );

    renderDetail("invalid-id");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Listing ID must contain only digits"
    );
  });

  it("goes back to the listings page from the back link", async () => {
    renderDetail();

    await screen.findByText("$3,950,000");
    await userEvent.click(screen.getByRole("link", { name: /back to listings/i }));

    expect(screen.getByText("Listings page")).toBeInTheDocument();
  });
});
