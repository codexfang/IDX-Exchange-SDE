import React, { useEffect, useState } from "react";
import { parsePhotos } from "../utils/photos";

// Arrow clicks live inside a link card, so they must not navigate.
function stop(event) {
  event.preventDefault();
  event.stopPropagation();
}

function PropertyImageCarousel({ photos: rawPhotos, alt }) {
  const photos = parsePhotos(rawPhotos);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [rawPhotos]);

  if (photos.length === 0) {
    return (
      <div className="card-media--placeholder">
        <span>No photo available</span>
      </div>
    );
  }

  const safeIndex = Math.min(index, photos.length - 1);
  const multiple = photos.length > 1;

  function go(delta) {
    setIndex((current) => (current + delta + photos.length) % photos.length);
  }

  return (
    <div className="carousel">
      <img
        src={photos[safeIndex]}
        alt={`${alt || "Property"} — view ${safeIndex + 1}`}
        loading="lazy"
      />

      {multiple && (
        <>
          <button
            type="button"
            className="carousel-arrow carousel-arrow--prev"
            aria-label="Previous photo"
            onClick={(event) => {
              stop(event);
              go(-1);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className="carousel-arrow carousel-arrow--next"
            aria-label="Next photo"
            onClick={(event) => {
              stop(event);
              go(1);
            }}
          >
            ›
          </button>
        </>
      )}

      <span className="carousel-counter">
        {safeIndex + 1} / {photos.length}
      </span>
    </div>
  );
}

export default PropertyImageCarousel;
