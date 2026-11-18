const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;
const MAX_LISTING_ID_LENGTH = 20;

// Sort whitelist: sortBy values are the real column names in rets_property, not
// RESO names. ListPrice, LivingArea and ListingContractDate-style RESO names do
// not exist on this table, and sorting by one would either error or silently
// return unsorted rows, so anything outside this map is rejected with a 400.
const SORT_FIELDS = {
  L_SystemPrice: "L_SystemPrice",
  ListingContractDate: "ListingContractDate",
  LM_Int2_3: "LM_Int2_3",
  L_Keyword2: "L_Keyword2",
};

const SORT_ORDERS = ["asc", "desc"];
const SORTABLE_FIELDS = Object.keys(SORT_FIELDS);

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
  "L_Photos",
  "LMD_MP_Latitude",
  "LMD_MP_Longitude",
  "ListingContractDate",
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

const DETAIL_COLUMNS = [
  "Appliances",
  "ArchitecturalStyle",
  "AssociationAmenities",
  "AssociationFee",
  "AssociationFee2Frequency",
  "AssociationFeeFrequency",
  "AssociationName",
  "AttachedGarageYN",
  "BackOnMarketDate",
  "CoListAgentFullName",
  "CommonInterest",
  "CommonWalls",
  "CommunityFeatures",
  "Cooling",
  "CountrySubdivision",
  "CountyOrParish",
  "CumulativeDaysOnMarket",
  "DaysOnMarket",
  "DaysOnMarketReplicationDate",
  "Disclosures",
  "ElevationUnits",
  "EntryLocation",
  "Fencing",
  "FireplaceFeatures",
  "FireplaceYN",
  "Flooring",
  "Heating",
  "HighSchoolDistrict",
  "InteriorFeatures",
  "LA1_UserFirstName",
  "LA1_UserLastName",
  "LMD_MP_Latitude",
  "LMD_MP_Longitude",
  "LM_Dec_3",
  "LM_Int2_3",
  "LM_char10_70",
  "LO1_OrganizationName",
  "L_Address",
  "L_AddressStreet",
  "L_City",
  "L_Class",
  "L_DisplayId",
  "L_Keyword1",
  "L_Keyword2",
  "L_Keyword5",
  "L_Keyword7",
  "L_ListingID",
  "L_Photos",
  "L_Remarks",
  "L_State",
  "L_Status",
  "L_SystemPrice",
  "L_Type_",
  "L_Zip",
  "ListAgentAOR",
  "ListAgentDirectPhone",
  "ListAgentEmail",
  "ListAgentFullName",
  "ListAgentKey",
  "ListAgentOfficePhone",
  "ListOfficeEmail",
  "ListingContractDate",
  "ListingTerms",
  "LivingAreaSource",
  "LivingAreaUnits",
  "LotFeatures",
  "LotSizeAcres",
  "LotSizeArea",
  "LotSizeSquareFeet",
  "LotSizeUnits",
  "MainLevelBedrooms",
  "MajorChangeTimestamp",
  "ModificationTimestamp",
  "NewConstructionYN",
  "OccupantType",
  "OnMarketDate",
  "OriginalEntryTimestamp",
  "ParcelNumber",
  "PatioAndPorchFeatures",
  "PhotoCount",
  "PhotoTime",
  "PhotosChangeTimestamp",
  "PoolFeatures",
  "PostalCity",
  "PreviousListPrice",
  "PreviousStandardStatus",
  "PriceChangeTimestamp",
  "PropertyCondition",
  "PropertySubTypeAdditional",
  "Roof",
  "RoomType",
  "SecurityFeatures",
  "SpaFeatures",
  "SpecialListingConditions",
  "StandardStatus",
  "StatusChangeTimestamp",
  "StructureType",
  "SubdivisionName",
  "TaxLot",
  "UniversalParcelId",
  "View",
  "ViewYN",
  "WaterSource",
  "YearBuilt",
].join(", ");

function validateListingId(raw) {
  const value = String(raw ?? "").trim();

  if (value.length === 0) {
    return { error: "Listing ID is required" };
  }

  if (!/^\d+$/.test(value)) {
    return { error: "Listing ID must contain only digits" };
  }

  if (value.length > MAX_LISTING_ID_LENGTH) {
    return {
      error: `Listing ID must be ${MAX_LISTING_ID_LENGTH} digits or fewer`,
    };
  }

  return { listingId: value };
}

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

  if (query.sortBy !== undefined) {
    const sortBy = String(query.sortBy).trim();
    if (!Object.prototype.hasOwnProperty.call(SORT_FIELDS, sortBy)) {
      errors.push(`sortBy must be one of: ${SORTABLE_FIELDS.join(", ")}`);
    } else {
      clean.sortBy = sortBy;
    }
  }

  if (query.sortOrder !== undefined) {
    const sortOrder = String(query.sortOrder).trim().toLowerCase();
    if (!SORT_ORDERS.includes(sortOrder)) {
      errors.push("sortOrder must be asc or desc");
    } else {
      clean.sortOrder = sortOrder;
    }
  }

  if (clean.sortBy === undefined && clean.sortOrder !== undefined) {
    errors.push("sortOrder requires sortBy");
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

  if (filters.sortBy !== undefined) {
    // A row with no value for the sort column cannot be ordered, and pushing
    // those rows to the end with an `IS NULL` sort key would stop MySQL from
    // reading the column index in order (a 10s filesort instead of an index
    // scan). Excluding them keeps the ordering fast and the total honest.
    conditions.push(`${SORT_FIELDS[filters.sortBy]} IS NOT NULL`);
  }

  return {
    where: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

// The column name is looked up in the whitelist and never interpolated from user
// input, so the ORDER BY clause cannot carry SQL. The id tie-break uses the same
// direction as the sort column: a mixed direction such as `price DESC, id ASC`
// forces a filesort, while matching directions let MySQL walk the index
// backwards instead. id keeps the order stable so paging cannot repeat or skip
// rows that share the same price, date or square footage.
function buildOrderBy({ sortBy, sortOrder } = {}) {
  const column = sortBy ? SORT_FIELDS[sortBy] : null;

  if (!column) return "ORDER BY id ASC";

  const direction = sortOrder === "desc" ? "DESC" : "ASC";
  return `ORDER BY ${column} ${direction}, id ${direction}`;
}

module.exports = {
  MAX_LIMIT,
  DEFAULT_LIMIT,
  MAX_LISTING_ID_LENGTH,
  SORT_FIELDS,
  SORTABLE_FIELDS,
  SORT_ORDERS,
  SELECT_COLUMNS,
  DETAIL_COLUMNS,
  validate,
  validateListingId,
  buildWhere,
  buildOrderBy,
};