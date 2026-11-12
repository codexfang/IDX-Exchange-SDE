import React from "react";
import {
  formatOpenHouseDate,
  formatTimeRange,
} from "../utils/format";

/**
 * OpenHouseRemarks is not a column on rets_openhouse — it lives inside the
 * all_data JSON blob, which the API returns as a raw string. Parsing happens
 * here so the backend response stays untouched.
 */
export function parseOpenHouseRemarks(raw) {
  if (raw === null || raw === undefined || raw === "") return "";

  let data = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw);
    } catch {
      return "";
    }
  }

  if (!data || typeof data !== "object") return "";

  const remarks = data.OpenHouseRemarks;
  return typeof remarks === "string" ? remarks.trim() : "";
}

function OpenHouses({ openHouses }) {
  const list = Array.isArray(openHouses) ? openHouses : [];

  return (
    <section className="open-houses" aria-label="Open houses">
      <h2>Open Houses</h2>

      {list.length === 0 ? (
        <p className="open-houses-empty">No open houses scheduled</p>
      ) : (
        <ul className="open-house-list">
          {list.map((openHouse, index) => {
            const date = formatOpenHouseDate(openHouse.OpenHouseDate);
            const time = formatTimeRange(openHouse.OH_StartTime, openHouse.OH_EndTime);
            const remarks = parseOpenHouseRemarks(openHouse.all_data);

            return (
              <li key={openHouse.id ?? `${date}-${index}`} className="open-house">
                <p className="open-house-when">
                  <strong>{date || "Date to be announced"}</strong>
                  {time && <span className="open-house-time">{time}</span>}
                </p>
                {remarks && <p className="open-house-remarks">{remarks}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default OpenHouses;
