import React from "react";

// Values are "<column>:<direction>" where the column is the real name in
// rets_property. The backend only accepts the columns on its whitelist, so these
// pairs must stay in step with SORT_FIELDS in backend/src/propertyQuery.js.
export const SORT_OPTIONS = [
  { value: "", label: "Default order" },
  { value: "L_SystemPrice:asc", label: "Price: Low to High" },
  { value: "L_SystemPrice:desc", label: "Price: High to Low" },
  { value: "ListingContractDate:desc", label: "Date listed: Newest first" },
  { value: "ListingContractDate:asc", label: "Date listed: Oldest first" },
  { value: "LM_Int2_3:desc", label: "Square footage: Largest first" },
  { value: "LM_Int2_3:asc", label: "Square footage: Smallest first" },
  { value: "L_Keyword2:desc", label: "Beds: Most first" },
  { value: "L_Keyword2:asc", label: "Beds: Fewest first" },
];

export function sortOptionValue(sortBy, sortOrder) {
  return sortBy ? `${sortBy}:${sortOrder || "asc"}` : "";
}

function SortControls({ sortBy, sortOrder, onChange }) {
  function handleChange(event) {
    const value = event.target.value;

    if (value === "") {
      onChange({ sortBy: null, sortOrder: null });
      return;
    }

    const [field, order] = value.split(":");
    onChange({ sortBy: field, sortOrder: order });
  }

  return (
    <div className="sort-controls">
      <label htmlFor="sort-select">Sort by</label>
      <select
        id="sort-select"
        value={sortOptionValue(sortBy, sortOrder)}
        onChange={handleChange}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value || "default"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortControls;
