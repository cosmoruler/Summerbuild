import { useState, useEffect } from "react";

/**
 * Custom hook to fetch restaurant recommendations from the backend API.
 * @param {Object} userLocation - The user's location { lat, lng }.
 * @param {string} searchTerm - The user's search query.
 * @param {Array} priceRange - [min, max] price range.
 * @param {Array} ratingRange - [min, max] rating range.
 * @param {boolean} bookable - Whether to filter for bookable places.
 * @returns {Object} { results, loading, error }
 */
export default function useRecommendations(userLocation, searchTerm, priceRange, ratingRange, bookable) {
  // State to store the fetched recommendations
  const [results, setResults] = useState([]);
  // State to indicate loading status
  const [loading, setLoading] = useState(false);
  // State to store any error message
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only fetch if location is available
    if (userLocation && userLocation.lat && userLocation.lng) {
      setLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        lat: userLocation.lat,
        lon: userLocation.lng,
        query: searchTerm || "",
        price_min: priceRange ? priceRange[0] : 1,
        price_max: priceRange ? priceRange[1] : 5,
        rating_min: ratingRange ? ratingRange[0] : 1,
        rating_max: ratingRange ? ratingRange[1] : 6,
        bookable: bookable ? "true" : "false"
      });

      // Fetch recommendations from backend
      fetch(`http://localhost:8000/api/recommend?${params.toString()}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch recommendations");
          return res.json();
        })
        .then((data) => {
          setResults(data.results || []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [userLocation, searchTerm, priceRange, ratingRange, bookable]);

  // Return the results, loading, and error states
  return { results, loading, error };
} 