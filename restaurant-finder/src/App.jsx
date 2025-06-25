import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RestaurantFinder from './components/RestaurantFinder.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import useUserLocation from './useUserLocation.js';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';

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

  return (
    <Routes>
      <Route path="/" element={<RestaurantFinder userLocation={userLocation} />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="*" element={<div className="p-8 text-center">Page not found.</div>} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
