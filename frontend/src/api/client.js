const API_BASE = "/api";

class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.append(key, value);
    }
  });

  let response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new ApiError(
      "Could not reach the server. Is the API running on port 5000?",
      0,
      null
    );
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 400 && payload && Array.isArray(payload.details)) {
      throw new ApiError(payload.details.join(", "), 400, payload.details);
    }
    if (response.status === 404) {
      throw new ApiError(
        (payload && payload.message) || "Not found",
        404,
        payload
      );
    }
    if (response.status >= 500) {
      throw new ApiError(
        "The API is not responding. Is the Express server running on port 5000?",
        response.status,
        payload
      );
    }
    throw new ApiError(
      (payload && payload.error) || `Request failed with status ${response.status}`,
      response.status,
      payload
    );
  }

  return payload;
}

export function fetchProperties(params = {}) {
  return request("/properties", params);
}

export function fetchPropertyDetail(id) {
  return request(`/properties/${encodeURIComponent(id)}`);
}

export function fetchOpenHouses(id) {
  return request(`/properties/${encodeURIComponent(id)}/openhouses`);
}

export { ApiError };
