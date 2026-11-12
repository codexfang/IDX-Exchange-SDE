import React from "react";

function toCoordinate(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function PropertyMap({ latitude, longitude, address }) {
  const lat = toCoordinate(latitude);
  const lng = toCoordinate(longitude);

  // Without both coordinates there is nothing to point the map at.
  if (lat === null || lng === null) return null;

  // Read at render time so a restart with the key in frontend/.env picks it up.
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(
    apiKey || ""
  )}&q=${lat},${lng}&zoom=15`;
  const directionsSrc = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const label = address || "this property";

  return (
    <section className="map" aria-label="Property location">
      <h2>Location</h2>

      {apiKey ? (
        <iframe
          className="map-frame"
          title={`Map of ${label}`}
          src={mapSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      ) : (
        <p className="map-missing">
          Add <code>REACT_APP_GOOGLE_MAPS_API_KEY</code> to{" "}
          <code>frontend/.env</code> and restart the dev server to see the map.
        </p>
      )}

      <a
        className="map-directions"
        href={directionsSrc}
        target="_blank"
        rel="noopener noreferrer"
      >
        Get Directions
      </a>
    </section>
  );
}

export default PropertyMap;
