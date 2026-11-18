import React, { useEffect, useRef, useState } from "react";
import { fetchProperties } from "../api/client";
import PropertyCard from "./PropertyCard";
import PropertyFilters from "./PropertyFilters";
import Pagination from "./Pagination";
import SortControls from "./SortControls";
import FavoritesLink from "./FavoritesLink";

const PAGE_SIZE = 20;
const DEFAULT_SORT = { sortBy: null, sortOrder: null };

function ListingsPage() {
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchVersion, setSearchVersion] = useState(0);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState(DEFAULT_SORT);
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
          ...(sort.sortBy ? { sortBy: sort.sortBy, sortOrder: sort.sortOrder } : {}),
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
  }, [activeFilters, searchVersion, currentPage, sort]);

  function search(filters) {
    requestGeneration.current += 1;
    setProperties([]);
    setTotal(0);
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setSort(DEFAULT_SORT);
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
    setSort(DEFAULT_SORT);
    setActiveFilters({});
    setSearchVersion((version) => version + 1);
  }

  function changePage(page) {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }

  // Sorting starts a new ordering, so the old page number no longer points at
  // anything meaningful: go back to page 1 and show the first page of the new sort.
  function changeSort(nextSort) {
    requestGeneration.current += 1;
    setProperties([]);
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setSort(nextSort);
    window.scrollTo(0, 0);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const firstShown = (currentPage - 1) * PAGE_SIZE + 1;
  const lastShown = firstShown + properties.length - 1;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Property Listings</h1>
          <p className="result-count">
            {properties.length > 0
              ? `Showing ${firstShown}-${lastShown} of ${total.toLocaleString("en-US")} properties`
              : `Showing 0 of ${total.toLocaleString("en-US")} properties`}
          </p>
        </div>
        <FavoritesLink />
      </header>

      <PropertyFilters onSearch={search} onClear={clearFilters} />

      <div className="list-toolbar">
        <SortControls
          sortBy={sort.sortBy}
          sortOrder={sort.sortOrder}
          onChange={changeSort}
        />
      </div>

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
