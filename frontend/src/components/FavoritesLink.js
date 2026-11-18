import React from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../hooks/useFavorites";

function FavoritesLink({ className }) {
  const { count } = useFavorites();

  return (
    <Link
      className={`favorites-link${className ? ` ${className}` : ""}`}
      to="/favorites"
      aria-label={
        count > 0
          ? `View favorites, ${count} saved`
          : "View favorites, none saved yet"
      }
    >
      <span className="favorites-link-heart" aria-hidden="true">
        {count > 0 ? "♥" : "♡"}
      </span>
      <span>Favorites</span>
      <span className="favorites-count">{count}</span>
    </Link>
  );
}

export default FavoritesLink;
