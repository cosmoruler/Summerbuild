import React, { useState, useEffect } from 'react';

function LocationButton() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [showButton, setShowButton] = useState(true);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      setShowButton(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setShowButton(false);
      },
      (err) => {
        setError(`Error: ${err.message}`);
        setLocation(null);
        setShowButton(true);
      },
      { timeout: 10000 } // 10 seconds
    );
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      {showButton && (
        <button
          onClick={requestLocation}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 text-white text-lg font-semibold shadow-md transition-all duration-200 hover:from-indigo-400 hover:to-indigo-600 flex items-center gap-2"
        >
          <span role="img" aria-label="location">📍</span> Get My Location
        </button>
      )}

      {location && (
        <div className="bg-slate-100 rounded-xl px-6 py-4 text-slate-700 text-base shadow">
          <span className="font-medium">Latitude:</span> {location.latitude}<br />
          <span className="font-medium">Longitude:</span> {location.longitude}
        </div>
      )}

      {error && <p className="text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export default LocationButton;
