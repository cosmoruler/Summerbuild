import React from 'react';
import RestaurantFinder from './components/RestaurantFinder.jsx';
import AuthPage from './components/AuthPage.jsx';
import useUserLocation from './useUserLocation.js';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
// import LocationButton from './LocationButton.jsx'; // No longer needed

// Component that handles the conditional rendering
function AppContent() {
  const { user, loading } = useAuth();
  const userLocation = useUserLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <RestaurantFinder userLocation={userLocation} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
