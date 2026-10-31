import React, { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "./PropertyCard";
import PropertyFilters from "./PropertyFilters";
import Pagination from "./Pagination";

const PAGE_SIZE = 20;

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const requestGeneration = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const generation = requestGeneration.current;
      setLoading(true);
      setError(null);

      try {
        const params = Object.fromEntries(
          Object.entries(activeFilters).filter(([, value]) => value !== "")
        );
        const data = await fetchProperties({
          ...params,
          limit: PAGE_SIZE,
          offset: (currentPage - 1) * PAGE_SIZE,
        });
        if (cancelled || generation !== requestGeneration.current) return;
        setProperties(data.results || []);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (cancelled || generation !== requestGeneration.current) return;
        setError(err.message);
        setProperties([]);
        setTotal(0);
      } finally {
        if (!cancelled && generation === requestGeneration.current) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [activeFilters, searchVersion, currentPage]);

  function search(filters) {
    requestGeneration.current += 1;
    setProperties([]);
    setTotal(0);
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setActiveFilters({ ...filters });
    setSearchVersion((version) => version + 1);
  }

  function clearFilters() {
    requestGeneration.current += 1;
    setProperties([]);
    setTotal(0);
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setActiveFilters({});
    setSearchVersion((version) => version + 1);
  }

  function changePage(page) {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstShown = (currentPage - 1) * PAGE_SIZE + 1;
  const lastShown = firstShown + properties.length - 1;

  return (
    <main className="page">
      <header className="page-header">
        <h1>Property Listings</h1>
        <p className="result-count">
          {properties.length > 0
            ? `Showing ${firstShown}-${lastShown} of ${total.toLocaleString("en-US")} properties`
            : `Showing 0 of ${total.toLocaleString("en-US")} properties`}
        </p>
      </header>

      <PropertyFilters onSearch={search} onClear={clearFilters} />

      {loading ? (
        <p className="status status--loading" role="status">Loading properties…</p>
      ) : error ? (
        <div className="status status--error" role="alert">
          <p className="status-title">Could not load properties</p>
          <p className="status-message">{error}</p>
        </div>
      ) : properties.length === 0 ? (
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

      {!loading && !error && properties.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={changePage}
        />
      )}
    </main>
  );
}

export default ListingsPage;
