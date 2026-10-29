import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import ListingsPage from "./ListingsPage";
import userEvent from "@testing-library/user-event";
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

  it("submits combined filters and clears them to reload all listings", async () => {
    fetchProperties
      .mockResolvedValueOnce(sample)
      .mockResolvedValueOnce({ ...sample, total: 0, results: [] })
      .mockResolvedValueOnce(sample);

    render(<ListingsPage />);
    await screen.findByText("1461 Laurel Way");

    await userEvent.type(screen.getByLabelText("City"), "Irvine");
    await userEvent.selectOptions(screen.getByLabelText("Beds"), "3");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    await screen.findByText(/no properties matched/i);
    expect(fetchProperties).toHaveBeenLastCalledWith({
      city: "Irvine",
      beds: "3",
      limit: 20,
      offset: 0,
    });

    await userEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
    await screen.findByText("1461 Laurel Way");
    expect(fetchProperties).toHaveBeenLastCalledWith({ limit: 20, offset: 0 });
    expect(screen.getByLabelText("City")).toHaveValue("");
  });

  it("does not flash stale results when an earlier search resolves late", async () => {
    let resolveFirstSearch;
    fetchProperties
      .mockResolvedValueOnce(sample)
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirstSearch = resolve; }))
      .mockResolvedValueOnce(sample)
      .mockResolvedValueOnce({ ...sample, results: [{ ...sample.results[0], id: 2, L_Address: "New Search Result" }] });

    render(<ListingsPage />);
    await screen.findByText("1461 Laurel Way");

    await userEvent.type(screen.getByLabelText("City"), "Old City");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));
    await waitFor(() => expect(fetchProperties).toHaveBeenCalledTimes(2));

    await userEvent.click(screen.getByRole("button", { name: "Clear Filters" }));
    await waitFor(() => expect(fetchProperties).toHaveBeenCalledTimes(3));
    expect(screen.getByLabelText("City")).toHaveValue("");

    await userEvent.type(screen.getByLabelText("City"), "New City");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("New Search Result")).toBeInTheDocument();
    await act(async () => {
      resolveFirstSearch({ ...sample, results: [{ ...sample.results[0], L_Address: "Stale Result" }] });
    });
    expect(screen.queryByText("Stale Result")).not.toBeInTheDocument();
    expect(screen.getByText("New Search Result")).toBeInTheDocument();
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
