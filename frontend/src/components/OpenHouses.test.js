import React from "react";
import { render, screen } from "@testing-library/react";
import OpenHouses, { parseOpenHouseRemarks } from "./OpenHouses";

function openHouse(overrides = {}) {
  return {
    id: 1,
    L_ListingID: "1178585070",
    OpenHouseDate: "2024-05-04T00:00:00.000Z",
    OH_StartTime: "13:00:00",
    OH_EndTime: "16:00:00",
    all_data: JSON.stringify({
      OpenHouseRemarks: "Come tour this beautiful home. Refreshments provided.",
      OtherField: "ignored",
    }),
    ...overrides,
  };
}

describe("OpenHouses", () => {
  it("shows the date and formatted start/end times", () => {
    render(<OpenHouses openHouses={[openHouse()]} />);

    expect(screen.getByText("Saturday, May 4, 2024")).toBeInTheDocument();
    expect(screen.getByText("1:00 PM – 4:00 PM")).toBeInTheDocument();
  });

  it("shows remarks that live inside the all_data JSON blob", () => {
    render(<OpenHouses openHouses={[openHouse()]} />);

    expect(
      screen.getByText("Come tour this beautiful home. Refreshments provided.")
    ).toBeInTheDocument();
  });

  it("still renders the date when all_data has no remarks", () => {
    render(
      <OpenHouses
        openHouses={[openHouse({ all_data: JSON.stringify({ OpenHouseType: "In Person" }) })]}
      />
    );

    expect(screen.getByText("Saturday, May 4, 2024")).toBeInTheDocument();
    expect(screen.queryByText(/come tour/i)).not.toBeInTheDocument();
  });

  it("does not crash when all_data is malformed JSON", () => {
    expect(() =>
      render(<OpenHouses openHouses={[openHouse({ all_data: "{oops" })]} />)
    ).not.toThrow();

    expect(screen.getByText("Saturday, May 4, 2024")).toBeInTheDocument();
  });

  it("lists every scheduled open house", () => {
    render(
      <OpenHouses
        openHouses={[
          openHouse(),
          openHouse({
            id: 2,
            OpenHouseDate: "2024-05-05T00:00:00.000Z",
            OH_StartTime: "11:00:00",
            OH_EndTime: "14:00:00",
            all_data: JSON.stringify({ OpenHouseRemarks: "Second showing." }),
          }),
        ]}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Sunday, May 5, 2024")).toBeInTheDocument();
    expect(screen.getByText("11:00 AM – 2:00 PM")).toBeInTheDocument();
    expect(screen.getByText("Second showing.")).toBeInTheDocument();
  });

  it("shows a friendly message when nothing is scheduled", () => {
    render(<OpenHouses openHouses={[]} />);

    expect(screen.getByText("No open houses scheduled")).toBeInTheDocument();
  });

  it("treats a missing open house list as empty", () => {
    render(<OpenHouses />);

    expect(screen.getByText("No open houses scheduled")).toBeInTheDocument();
  });
});

describe("parseOpenHouseRemarks", () => {
  it("reads OpenHouseRemarks out of the JSON string", () => {
    expect(
      parseOpenHouseRemarks(JSON.stringify({ OpenHouseRemarks: " Walk-ins welcome " }))
    ).toBe("Walk-ins welcome");
  });

  it("returns an empty string for missing or unusable input", () => {
    expect(parseOpenHouseRemarks(null)).toBe("");
    expect(parseOpenHouseRemarks("")).toBe("");
    expect(parseOpenHouseRemarks("not json")).toBe("");
    expect(parseOpenHouseRemarks(JSON.stringify({ OpenHouseRemarks: null }))).toBe("");
  });
});
