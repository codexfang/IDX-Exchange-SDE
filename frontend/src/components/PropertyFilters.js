import React, { useState } from "react";

const EMPTY_FILTERS = {
  city: "",
  zipcode: "",
  minPrice: "",
  maxPrice: "",
  beds: "",
  baths: "",
};

function PropertyFilters({ onSearch, onClear }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function submit(event) {
    event.preventDefault();
    onSearch(filters);
  }

  function clear() {
    setFilters(EMPTY_FILTERS);
    onClear();
  }

  return (
    <form className="filters" onSubmit={submit} aria-label="Property filters">
      <div className="filter-field">
        <label htmlFor="filter-city">City</label>
        <input id="filter-city" name="city" value={filters.city} onChange={updateFilter} />
      </div>
      <div className="filter-field">
        <label htmlFor="filter-zipcode">ZIP code</label>
        <input
          id="filter-zipcode"
          name="zipcode"
          inputMode="numeric"
          value={filters.zipcode}
          onChange={updateFilter}
        />
      </div>
      <div className="filter-field">
        <label htmlFor="filter-min-price">Min price</label>
        <input
          id="filter-min-price"
          name="minPrice"
          type="number"
          min="0"
          value={filters.minPrice}
          onChange={updateFilter}
        />
      </div>
      <div className="filter-field">
        <label htmlFor="filter-max-price">Max price</label>
        <input
          id="filter-max-price"
          name="maxPrice"
          type="number"
          min="0"
          value={filters.maxPrice}
          onChange={updateFilter}
        />
      </div>
      <div className="filter-field">
        <label htmlFor="filter-beds">Beds</label>
        <select id="filter-beds" name="beds" value={filters.beds} onChange={updateFilter}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((count) => (
            <option key={count} value={count}>{count}+</option>
          ))}
        </select>
      </div>
      <div className="filter-field">
        <label htmlFor="filter-baths">Baths</label>
        <select id="filter-baths" name="baths" value={filters.baths} onChange={updateFilter}>
          <option value="">Any</option>
          {[1, 1.5, 2, 2.5, 3, 4, 5].map((count) => (
            <option key={count} value={count}>{count}+</option>
          ))}
        </select>
      </div>
      <div className="filter-actions">
        <button type="submit">Search</button>
        <button type="button" className="button-secondary" onClick={clear}>
          Clear Filters
        </button>
      </div>
    </form>
  );
}

export default PropertyFilters;
