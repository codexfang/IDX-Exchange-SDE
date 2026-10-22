import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import ListingsPage from "./ListingsPage";
import { fetchProperties } from "../api/client";

jest.mock("../api/client");

const sample = {
  total: 55212,
  limit: 20,
  offset: 0,
  results: [
    {
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
    },
  ],
};

describe("ListingsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a loading state while fetching", async () => {
    let resolve;
    fetchProperties.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );

    render(<ListingsPage />);

    expect(screen.getByText(/loading properties/i)).toBeInTheDocument();

    await act(async () => {
      resolve(sample);
    });

    await waitFor(() =>
      expect(screen.getByText("1461 Laurel Way")).toBeInTheDocument()
    );
  });

  it("renders the property grid and the result count", async () => {
    fetchProperties.mockResolvedValue(sample);

    render(<ListingsPage />);

    await waitFor(() =>
      expect(screen.getByText("1461 Laurel Way")).toBeInTheDocument()
    );

    expect(screen.getByText("Showing 1 of 55,212 properties")).toBeInTheDocument();
  });

  it("shows an error message when the API fails", async () => {
    fetchProperties.mockRejectedValue(new Error("Could not reach the server."));

    render(<ListingsPage />);

    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument()
    );

    expect(screen.getByText("Could not load properties")).toBeInTheDocument();
    expect(screen.getByText("Could not reach the server.")).toBeInTheDocument();
  });

  it("shows an empty state when no properties match", async () => {
    fetchProperties.mockResolvedValue({
      total: 0,
      limit: 20,
      offset: 0,
      results: [],
    });

    render(<ListingsPage />);

    await waitFor(() =>
      expect(screen.getByText(/no properties matched/i)).toBeInTheDocument()
    );
  });
});
