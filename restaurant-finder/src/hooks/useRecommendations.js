import { useState, useEffect } from "react";

/**
 * Custom hook to fetch restaurant recommendations from the backend API.
 * @param {Object} userLocation - The user's location { lat, lng }.
 * @param {string} searchTerm - The user's search query.
 * @returns {Object} { results, loading, error }
 */
export default function useRecommendations(userLocation, searchTerm) {
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

      // Build the API URL with query parameters
      const url = `http://localhost:8000/api/recommend?lat=${userLocation.lat}&lon=${userLocation.lng}&query=${encodeURIComponent(searchTerm || "")}`;

      // Fetch recommendations from backend
      fetch(url)
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
  }, [userLocation, searchTerm]);

  // Return the results, loading, and error states
  return { results, loading, error };
} 