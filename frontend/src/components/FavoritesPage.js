import React from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../hooks/useFavorites";
import PropertyCard from "./PropertyCard";

function FavoritesPage() {
  const { favorites, count } = useFavorites();

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Favorites</h1>
          <p className="result-count">
            {count === 0
              ? "No saved properties yet"
              : count === 1
              ? "1 saved property"
              : `${count} saved properties`}
          </p>
        </div>
        <Link className="back-link" to="/">
          ← Back to listings
        </Link>
      </header>

      {count === 0 ? (
        <div className="status status--empty">
          <p className="status-title">You have not saved any properties</p>
          <p className="status-message">
            Click the heart on a listing to keep it here. Favorites stay on this
            device, so they survive a page refresh.
          </p>
          <Link className="empty-link" to="/">
            Browse properties
          </Link>
        </div>
      ) : (
        <div className="grid">
          {favorites.map((favorite) => (
            <PropertyCard key={favorite.id} property={favorite.property} />
          ))}
        </div>
      )}
    </main>
  );
}

export default FavoritesPage;
