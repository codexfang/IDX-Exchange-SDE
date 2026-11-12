import React, { useCallback, useEffect, useRef, useState } from "react";
import { parsePhotos } from "../utils/photos";

function PropertyImageGallery({ photos: rawPhotos, alt }) {
  const photos = parsePhotos(rawPhotos);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    setIndex(0);
    setLightboxOpen(false);
  }, [rawPhotos]);

  const safeIndex = photos.length === 0 ? 0 : Math.min(index, photos.length - 1);

  const go = useCallback(
    (delta) => {
      if (photos.length === 0) return;
      setIndex((current) => (current + delta + photos.length) % photos.length);
    },
    [photos.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return undefined;

    const node = dialogRef.current;
    if (!node) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setLightboxOpen(false);
      } else if (event.key === "ArrowLeft") {
        go(-1);
      } else if (event.key === "ArrowRight") {
        go(1);
      }
    }

    // A div only receives keydown once it can hold focus. tabIndex={-1} makes
    // it programmatically focusable, and focus() sends Escape/arrow keys here.
    node.focus();

    node.addEventListener("keydown", onKeyDown);
    return () => node.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, go]);

  if (photos.length === 0) {
    return (
      <div className="gallery placeholder" aria-label="Property photos">
        <div className="card-media--placeholder">
          <span>No photo available</span>
        </div>
      </div>
    );
  }

  const label = alt || "Property";

  return (
    <section className="gallery" aria-label="Property photos">
      <button
        type="button"
        className="gallery-main"
        onClick={() => setLightboxOpen(true)}
        aria-label={`Open full-screen photo of ${label}`}
      >
        <img src={photos[safeIndex]} alt={`${label} — view ${safeIndex + 1}`} />
        <span className="gallery-counter">
          {safeIndex + 1} / {photos.length}
        </span>
      </button>

      {photos.length > 1 && (
        <div className="gallery-thumbs" role="group" aria-label="Photo thumbnails">
          {photos.map((photo, photoIndex) => (
            <button
              key={`${photo}-${photoIndex}`}
              type="button"
              className={`gallery-thumb${photoIndex === safeIndex ? " gallery-thumb--active" : ""}`}
              aria-label={`Show photo ${photoIndex + 1}`}
              aria-current={photoIndex === safeIndex ? "true" : undefined}
              onClick={() => setIndex(photoIndex)}
            >
              <img src={photo} alt="" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Full-screen photo of ${label}`}
          tabIndex={-1}
          ref={dialogRef}
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false);
          }}
        >
          <div className="lightbox-content">
            <img
              src={photos[safeIndex]}
              alt={`${label} — full-screen view ${safeIndex + 1}`}
            />

            <button
              type="button"
              className="lightbox-close"
              aria-label="Close photo viewer"
              onClick={() => setLightboxOpen(false)}
            >
              ✕
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  className="lightbox-arrow lightbox-arrow--prev"
                  aria-label="Previous full-screen photo"
                  onClick={() => go(-1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="lightbox-arrow lightbox-arrow--next"
                  aria-label="Next full-screen photo"
                  onClick={() => go(1)}
                >
                  ›
                </button>
              </>
            )}

            <p className="lightbox-counter">
              {safeIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default PropertyImageGallery;
