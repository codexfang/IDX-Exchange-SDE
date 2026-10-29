import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import PropertyFilters from "./PropertyFilters";

describe("PropertyFilters", () => {
  it("shows all six filter inputs", () => {
    render(<PropertyFilters onSearch={jest.fn()} onClear={jest.fn()} />);

    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("ZIP code")).toBeInTheDocument();
    expect(screen.getByLabelText("Min price")).toBeInTheDocument();
    expect(screen.getByLabelText("Max price")).toBeInTheDocument();
    expect(screen.getByLabelText("Beds")).toBeInTheDocument();
    expect(screen.getByLabelText("Baths")).toBeInTheDocument();
  });

  it("submits the current values, including combined filters", () => {
    const onSearch = jest.fn();
    render(<PropertyFilters onSearch={onSearch} onClear={jest.fn()} />);

    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Irvine" } });
    fireEvent.change(screen.getByLabelText("ZIP code"), { target: { value: "92618" } });
    fireEvent.change(screen.getByLabelText("Min price"), { target: { value: "300000" } });
    fireEvent.change(screen.getByLabelText("Max price"), { target: { value: "900000" } });
    fireEvent.change(screen.getByLabelText("Beds"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Baths"), { target: { value: "2.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledWith({
      city: "Irvine",
      zipcode: "92618",
      minPrice: "300000",
      maxPrice: "900000",
      beds: "3",
      baths: "2.5",
    });
  });

  it("clears the inputs and reloads the unfiltered listings", () => {
    const onSearch = jest.fn();
    const onClear = jest.fn();
    render(<PropertyFilters onSearch={onSearch} onClear={onClear} />);

    fireEvent.change(screen.getByLabelText("City"), { target: { value: "Irvine" } });
    fireEvent.change(screen.getByLabelText("Beds"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }));

    expect(screen.getByLabelText("City")).toHaveValue("");
    expect(screen.getByLabelText("Beds")).toHaveValue("");
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onSearch).not.toHaveBeenCalled();
  });
});
