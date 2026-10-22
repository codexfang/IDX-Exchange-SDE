import React, { useEffect, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "./PropertyCard";

const PAGE_SIZE = 20;

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchProperties({ limit: PAGE_SIZE, offset: 0 });
        if (cancelled) return;
        setProperties(data.results || []);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (cancelled) return;
        setError(err.message);
        setProperties([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="page">
        <h1>Property Listings</h1>
        <p className="status status--loading">Loading properties…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <h1>Property Listings</h1>
        <div className="status status--error" role="alert">
          <p className="status-title">Could not load properties</p>
          <p className="status-message">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Property Listings</h1>
        <p className="result-count">
          Showing {properties.length} of {total.toLocaleString("en-US")} properties
        </p>
      </header>

      {properties.length === 0 ? (
        <p className="status">No properties matched your search.</p>
      ) : (
        <div className="grid">
          {properties.map((property) => (
            <PropertyCard
              key={property.id ?? property.L_ListingID}
              property={property}
            />
          ))}
        </div>
      )}
    </main>
  );
}

export default ListingsPage;
