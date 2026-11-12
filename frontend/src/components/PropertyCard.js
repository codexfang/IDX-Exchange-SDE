import React from "react";
import { Link } from "react-router-dom";
import { formatBaths, formatCount, formatPrice } from "../utils/format";
import PropertyImageCarousel from "./PropertyImageCarousel";

function PropertyCard({ property }) {
  const baths = formatBaths(property.LM_Dec_3);
  const listingId = property.L_ListingID ?? property.id;
  const address = property.L_Address || "Address unavailable";

  return (
    <Link
      className="card"
      to={`/property/${encodeURIComponent(listingId)}`}
      aria-label={`View details for ${address}`}
    >
      <div className="card-media">
        <PropertyImageCarousel photos={property.L_Photos} alt={address} />
        {property.L_Status && (
          <span className="card-status">{property.L_Status}</span>
        )}
      </div>

      <div className="card-body">
        <p className="card-price">{formatPrice(property.L_SystemPrice)}</p>

        <h3 className="card-address">{address}</h3>

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
            <strong>{formatCount(property.LM_Int2_3) ?? "—"}</strong> sqft
          </li>
        </ul>
      </div>
    </Link>
  );
}

export default PropertyCard;
