import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchOpenHouses, fetchPropertyDetail } from "../api/client";
import {
  formatBaths,
  formatCount,
  formatPrice,
} from "../utils/format";
import OpenHouses from "./OpenHouses";
import PropertyImageGallery from "./PropertyImageGallery";
import PropertyMap from "./PropertyMap";

function yesNo(value) {
  if (value === true || value === 1 || value === "1" || value === "Yes") return "Yes";
  if (value === false || value === 0 || value === "0" || value === "No") return "No";
  return null;
}

function buildDetailRows(property) {
  if (!property) return [];

  const rows = [
    ["Property type", property.L_Type_],
    ["Sub type", property.PropertySubTypeAdditional],
    ["Structure", property.StructureType],
    ["Style", property.ArchitecturalStyle],
    ["Subdivision", property.SubdivisionName],
    ["County", property.CountyOrParish],
    ["Lot size", property.LotSizeAcres ? `${property.LotSizeAcres} acres` : null],
    ["HOA fee", property.AssociationFee],
    ["HOA frequency", property.AssociationFeeFrequency],
    ["Cooling", property.Cooling],
    ["Heating", property.Heating],
    ["Flooring", property.Flooring],
    ["Fireplace", property.FireplaceFeatures],
    ["Pool", property.PoolFeatures],
    ["View", property.View],
    ["Days on market", formatCount(property.DaysOnMarket)],
    ["MLS #", property.L_DisplayId],
    ["Listing agent", property.ListAgentFullName],
    ["Listing office", property.LO1_OrganizationName],
  ];

  return rows
    .map(([label, value]) => {
      if (value === null || value === undefined || value === "") return null;
      return [label, String(value)];
    })
    .filter(Boolean);
}

function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [openHouses, setOpenHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setProperty(null);
      setOpenHouses([]);

      let loadedProperty = null;
      try {
        loadedProperty = await fetchPropertyDetail(id);
        if (cancelled) return;
        setProperty(loadedProperty);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || "Could not load this property");
      }

      if (cancelled) return;
      setLoading(false);

      // Open houses are secondary: a failure here must not blank the page.
      if (!loadedProperty) return;
      try {
        const data = await fetchOpenHouses(id);
        if (!cancelled) setOpenHouses(Array.isArray(data.openHouses) ? data.openHouses : []);
      } catch {
        if (!cancelled) setOpenHouses([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="page">
        <p className="status status--loading" role="status">
          Loading property…
        </p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="page">
        <Link className="back-link" to="/">
          ← Back to listings
        </Link>
        <div className="status status--error" role="alert">
          <p className="status-title">Could not load this property</p>
          <p className="status-message">{error || "This listing does not exist."}</p>
        </div>
      </main>
    );
  }

  const baths = formatBaths(property.LM_Dec_3);
  const detailRows = buildDetailRows(property);
  const location = [property.L_City, property.L_State].filter(Boolean).join(", ");
  const fireplace = yesNo(property.FireplaceYN);

  return (
    <main className="page detail-page">
      <Link className="back-link" to="/">
        ← Back to listings
      </Link>

      <header className="detail-header">
        <div>
          <p className="detail-price">{formatPrice(property.L_SystemPrice)}</p>
          <h1 className="detail-address">
            {property.L_Address || "Address unavailable"}
          </h1>
          <p className="detail-location">
            {location || "Unknown city"}
            {property.L_Zip ? ` ${property.L_Zip}` : ""}
          </p>
        </div>
        {property.L_Status && (
          <span className="detail-status">{property.L_Status}</span>
        )}
      </header>

      <div className="detail-layout">
        <div className="detail-main">
          <PropertyImageGallery
            photos={property.L_Photos}
            alt={property.L_Address || "Property"}
          />

          <section className="detail-stats" aria-label="Property stats">
            <dl>
              <div>
                <dt>Beds</dt>
                <dd>{property.L_Keyword2 ?? "—"}</dd>
              </div>
              <div>
                <dt>Baths</dt>
                <dd>{baths ?? "—"}</dd>
              </div>
              <div>
                <dt>Sq Ft</dt>
                <dd>{formatCount(property.LM_Int2_3) ?? "—"}</dd>
              </div>
              <div>
                <dt>Year built</dt>
                <dd>{property.YearBuilt ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <section className="detail-description" aria-label="Description">
            <h2>Description</h2>
            <p>{property.L_Remarks || "No description provided for this listing."}</p>
          </section>

          <section className="detail-facts" aria-label="Property details">
            <h2>Property Details</h2>
            {detailRows.length === 0 ? (
              <p className="detail-muted">No additional details provided.</p>
            ) : (
              <dl className="detail-fact-list">
                {detailRows.map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {fireplace && (
              <p className="detail-muted">Fireplace: {fireplace}</p>
            )}
          </section>
        </div>

        <aside className="detail-side">
          <PropertyMap
            latitude={property.LMD_MP_Latitude}
            longitude={property.LMD_MP_Longitude}
            address={property.L_Address}
          />
          <OpenHouses openHouses={openHouses} />
        </aside>
      </div>
    </main>
  );
}

export default PropertyDetailPage;
