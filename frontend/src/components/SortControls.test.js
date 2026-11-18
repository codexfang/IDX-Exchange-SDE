import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SortControls, { SORT_OPTIONS, sortOptionValue } from "./SortControls";

describe("SortControls", () => {
  it("renders a labelled select with the default order selected", () => {
    render(<SortControls sortBy={null} sortOrder={null} onChange={jest.fn()} />);

    const select = screen.getByLabelText("Sort by");
    expect(select).toHaveValue("");
    expect(screen.getByRole("option", { name: "Default order" })).toBeInTheDocument();
  });

  it("offers both directions for every sortable column", () => {
    render(<SortControls sortBy={null} sortOrder={null} onChange={jest.fn()} />);

    expect(screen.getByRole("option", { name: "Price: Low to High" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Price: High to Low" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Date listed: Newest first" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Date listed: Oldest first" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Square footage: Largest first" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Beds: Most first" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Beds: Fewest first" })).toBeInTheDocument();
  });

  it("only sends column names the backend whitelists", () => {
    const allowed = ["L_SystemPrice", "ListingContractDate", "LM_Int2_3", "L_Keyword2"];

    for (const option of SORT_OPTIONS.filter((entry) => entry.value !== "")) {
      const [column, order] = option.value.split(":");
      expect(allowed).toContain(column);
      expect(["asc", "desc"]).toContain(order);
    }
  });

  it("reports the selected column and direction", async () => {
    const onChange = jest.fn();
    render(<SortControls sortBy={null} sortOrder={null} onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByLabelText("Sort by"),
      "Price: High to Low"
    );

    expect(onChange).toHaveBeenCalledWith({
      sortBy: "L_SystemPrice",
      sortOrder: "desc",
    });
  });

  it("shows the active sort passed in from the page", () => {
    render(
      <SortControls
        sortBy="ListingContractDate"
        sortOrder="desc"
        onChange={jest.fn()}
      />
    );

    expect(screen.getByLabelText("Sort by")).toHaveValue(
      "ListingContractDate:desc"
    );
  });

  it("clears the sort when the default option is chosen", async () => {
    const onChange = jest.fn();
    render(
      <SortControls
        sortBy="L_SystemPrice"
        sortOrder="asc"
        onChange={onChange}
      />
    );

    await userEvent.selectOptions(screen.getByLabelText("Sort by"), "Default order");

    expect(onChange).toHaveBeenCalledWith({ sortBy: null, sortOrder: null });
  });

  it("builds the option value from a sort column and direction", () => {
    expect(sortOptionValue("LM_Int2_3", "asc")).toBe("LM_Int2_3:asc");
    expect(sortOptionValue(null, null)).toBe("");
    expect(sortOptionValue("L_Keyword2", null)).toBe("L_Keyword2:asc");
  });
});
