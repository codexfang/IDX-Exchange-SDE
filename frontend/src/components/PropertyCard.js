import React from "react";
import { firstPhoto } from "../utils/photos";

function formatPrice(value) {
  if (value === null || value === undefined) return "Price unavailable";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Price unavailable";
  return `$${amount.toLocaleString("en-US")}`;
}

function formatBaths(value) {
  const baths = Number(value);
  if (!Number.isFinite(baths)) return null;
  return Number.isInteger(baths) ? String(baths) : baths.toFixed(1);
}

function PropertyCard({ property }) {
  const photo = firstPhoto(property.L_Photos);
  const baths = formatBaths(property.LM_Dec_3);

  return (
    <article className="card">
      <div className="card-media">
        {photo ? (
          <img
            src={photo}
            alt={property.L_Address || "Property"}
            loading="lazy"
            onError={(event) => {
              event.target.style.display = "none";
              event.target.parentElement.classList.add("card-media--broken");
            }}
          />
        ) : (
          <div className="card-media--placeholder">
            <span>No photo available</span>
          </div>
        )}
        {property.L_Status && (
          <span className="card-status">{property.L_Status}</span>
        )}
      </div>

      <div className="card-body">
        <p className="card-price">{formatPrice(property.L_SystemPrice)}</p>

        <h3 className="card-address">{property.L_Address || "Address unavailable"}</h3>

        <p className="card-location">
          {property.L_City || "Unknown city"}
          {property.L_State ? `, ${property.L_State}` : ""}
          {property.L_Zip ? ` ${property.L_Zip}` : ""}
        </p>

        <ul className="card-stats">
          <li>
            <strong>{property.L_Keyword2 ?? "—"}</strong> beds
          </li>
          <li>
            <strong>{baths ?? "—"}</strong> baths
          </li>
          <li>
            <strong>
              {property.LM_Int2_3 ? Number(property.LM_Int2_3).toLocaleString("en-US") : "—"}
            </strong>{" "}
            sqft
          </li>
        </ul>
      </div>
    </article>
  );
}

export default PropertyCard;
