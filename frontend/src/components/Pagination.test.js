import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination, { getPageNumbers } from "./Pagination";

describe("getPageNumbers", () => {
  it("shows every page when they all fit without ellipsis", () => {
    expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("uses an ellipsis for the end when near the start", () => {
    expect(getPageNumbers(1, 24)).toEqual([1, 2, 3, 4, 5, "...", 24]);
  });

  it("shows ellipsis on both sides for a middle page", () => {
    expect(getPageNumbers(5, 24)).toEqual([1, "...", 4, 5, 6, "...", 24]);
  });

  it("shows ellipsis only at the start when near the end", () => {
    expect(getPageNumbers(23, 24)).toEqual([1, "...", 20, 21, 22, 23, 24]);
  });

  it("never repeats the last page (regression for 1 ... 18 19 20 20)", () => {
    const pages = getPageNumbers(19, 20);
    expect(pages).toEqual([1, "...", 16, 17, 18, 19, 20]);
    expect(new Set(pages).size).toBe(pages.length);
  });

  it("never repeats any page for every position in a 24-page set", () => {
    for (let current = 1; current <= 24; current += 1) {
      const numbers = getPageNumbers(current, 24).filter((p) => p !== "...");
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });
});

describe("Pagination component", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("disables Previous on the first page and Next on the last page", () => {
    const { unmount } = render(
      <Pagination currentPage={1} totalPages={3} onPageChange={() => {}} />
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    unmount();

    render(<Pagination currentPage={3} totalPages={3} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("calls onPageChange with the clicked page number", () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Page 4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("moves to the previous and next pages", () => {
    const onPageChange = jest.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenLastCalledWith(2);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenLastCalledWith(4);
  });

  it("marks the current page as active", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it("renders ellipsis for large page counts", () => {
    render(<Pagination currentPage={5} totalPages={24} onPageChange={() => {}} />);
    expect(screen.getAllByText("…")).toHaveLength(2);
  });
});
