import React from 'react';
import RestaurantFinder from './components/RestaurantFinder.jsx';
import useUserLocation from './useUserLocation.js';
// import LocationButton from './LocationButton.jsx'; // No longer needed

function App() {
  // Call the hook only once here
  const userLocation = useUserLocation();

  return (
    <div>
      {/* Pass userLocation as a prop to RestaurantFinder */}
      <RestaurantFinder userLocation={userLocation} />
    </div>
  );
}

export default App;
