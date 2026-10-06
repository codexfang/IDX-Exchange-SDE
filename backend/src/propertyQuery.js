const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const SELECT_COLUMNS = [
  "L_ListingID",
  "L_DisplayId",
  "L_Address",
  "L_City",
  "L_State",
  "L_Zip",
  "L_SystemPrice",
  "L_Keyword2",
  "LM_Dec_3",
  "LM_Int2_3",
  "YearBuilt",
  "LotSizeAcres",
  "PhotoCount",
  "LMD_MP_Latitude",
  "LMD_MP_Longitude",
  "L_Status",
  "StandardStatus",
  "SubdivisionName",
  "LA1_UserFirstName",
  "LA1_UserLastName",
  "LO1_OrganizationName",
  "DaysOnMarket",
  "PropertySubTypeAdditional",
  "StructureType",
].join(", ");

function parseInteger(raw, name, { min, max }) {
  if (!/^\d+$/.test(raw)) {
    return { error: `${name} must be a whole number` };
  }
  const value = Number(raw);
  if (min !== undefined && value < min) {
    return { error: `${name} must be at least ${min}` };
  }
  if (max !== undefined && value > max) {
    return { error: `${name} must be ${max} or less` };
  }
  return { value };
}

function parseDecimal(raw, name) {
  if (!/^\d+(\.\d+)?$/.test(raw)) {
    return { error: `${name} must be a positive number` };
  }
  return { value: Number(raw) };
}

function validate(query) {
  const errors = [];
  const clean = {};

  if (query.city !== undefined) {
    const city = String(query.city).trim();
    if (city.length === 0) {
      errors.push("city must not be empty");
    } else if (city.length > 100) {
      errors.push("city must be 100 characters or fewer");
    } else {
      clean.city = city;
    }
  }

  if (query.zipcode !== undefined) {
    const zip = String(query.zipcode).trim();
    if (!/^\d{5}$/.test(zip)) {
      errors.push("zipcode must be a 5-digit number");
    } else {
      clean.zipcode = zip;
    }
  }

  for (const [param, name] of [
    ["minPrice", "minPrice"],
    ["maxPrice", "maxPrice"],
  ]) {
    if (query[param] !== undefined) {
      const parsed = parseInteger(String(query[param]), name, { min: 0 });
      if (parsed.error) errors.push(parsed.error);
      else clean[param] = parsed.value;
    }
  }

  if (
    clean.minPrice !== undefined &&
    clean.maxPrice !== undefined &&
    clean.minPrice > clean.maxPrice
  ) {
    errors.push("minPrice cannot be greater than maxPrice");
  }

  if (query.beds !== undefined) {
    const parsed = parseInteger(String(query.beds), "beds", { min: 0, max: 52 });
    if (parsed.error) errors.push(parsed.error);
    else clean.beds = parsed.value;
  }

  if (query.baths !== undefined) {
    const parsed = parseDecimal(String(query.baths), "baths");
    if (parsed.error) errors.push(parsed.error);
    else clean.baths = parsed.value;
  }

  if (query.limit === undefined) {
    clean.limit = DEFAULT_LIMIT;
  } else {
    const parsed = parseInteger(String(query.limit), "limit", {
      min: 1,
      max: MAX_LIMIT,
    });
    if (parsed.error) errors.push(parsed.error);
    else clean.limit = parsed.value;
  }

  if (query.offset === undefined) {
    clean.offset = 0;
  } else {
    const parsed = parseInteger(String(query.offset), "offset", { min: 0 });
    if (parsed.error) errors.push(parsed.error);
    else clean.offset = parsed.value;
  }

  if (errors.length > 0) {
    return { errors };
  }
  return { clean };
}

function buildWhere(filters) {
  const conditions = [];
  const values = [];

  if (filters.city !== undefined) {
    conditions.push("LOWER(TRIM(L_City)) = ?");
    values.push(filters.city.toLowerCase());
  }

  if (filters.zipcode !== undefined) {
    conditions.push("TRIM(L_Zip) = ?");
    values.push(filters.zipcode);
  }

  if (filters.minPrice !== undefined) {
    conditions.push("L_SystemPrice >= ?");
    values.push(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    conditions.push("L_SystemPrice <= ?");
    values.push(filters.maxPrice);
  }

  if (filters.beds !== undefined) {
    conditions.push("L_Keyword2 >= ?");
    values.push(filters.beds);
  }

  if (filters.baths !== undefined) {
    conditions.push("LM_Dec_3 >= ?");
    values.push(filters.baths);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

module.exports = {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  SELECT_COLUMNS,
  validate,
  buildWhere,
};