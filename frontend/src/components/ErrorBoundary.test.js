import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";

function Boom({ message = "Boom" }) {
  throw new Error(message);
}

function Sometimes({ shouldThrow }) {
  if (shouldThrow) throw new Error("Fragile view");
  return <p>Recovered content</p>;
}

describe("ErrorBoundary", () => {
  let consoleError;

  beforeEach(() => {
    // React logs caught render errors; keep the test output readable.
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it("renders its children when nothing goes wrong", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the recovery UI instead of crashing when a child throws", () => {
    expect(() =>
      render(
        <ErrorBoundary>
          <Boom />
        </ErrorBoundary>
      )
    ).not.toThrow();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Something went wrong" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /back to listings/i })
    ).toHaveAttribute("href", "/");
  });

  it("keeps the rest of the page usable and reassures about favorites", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(
      screen.getByText(/your saved favorites are still in this browser/i)
    ).toBeInTheDocument();
  });

  it("retries rendering the children when Try again is clicked", async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Sometimes shouldThrow />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();

    // The cause is fixed (e.g. a failed request succeeds) before the retry.
    rerender(
      <ErrorBoundary>
        <Sometimes shouldThrow={false} />
      </ErrorBoundary>
    );

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Recovered content")).toBeInTheDocument();
  });

  it("reports the error through the onError prop", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <Boom message="Reported failure" />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe("Reported failure");
    expect(onError.mock.calls[0][1]).toHaveProperty("componentStack");
  });

  it("handles a child that throws during its own render only", () => {
    render(
      <ErrorBoundary>
        <div>
          <p>Safe sibling</p>
          <Boom />
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Safe sibling")).not.toBeInTheDocument();
  });
});
