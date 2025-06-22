import React, { useEffect } from 'react';
import RestaurantFinder from './components/RestaurantFinder.jsx';
import useUserLocation from './useUserLocation.js';
import LocationButton from './LocationButton.jsx'; // <-- adjust path if needed

function App() {
  const userLocation = useUserLocation();

  useEffect(() => {
    if (userLocation) {
      console.log("User location:", userLocation);
    }
  }, [userLocation]);

  return (
    <div>
      <LocationButton />
      <h1>Restaurant Finder 🍽️</h1>
      <RestaurantFinder />
    </div>
  );
}

export default App;
