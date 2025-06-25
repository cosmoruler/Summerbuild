import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RestaurantFinder from './components/RestaurantFinder.jsx';
import AuthPage from './components/AuthPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import useUserLocation from './useUserLocation.js';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import UserProfile from './components/UserProfile';
import { Link } from 'react-router-dom';

function AdminRoute({ children }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(data?.is_admin);
      }
      setLoading(false);
    }
    checkAdmin();
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (!user || !isAdmin) return <div>Not authorized</div>;
  return children;
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <AuthPage />;
  return children;
}

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
      <Route path="/profile" element={
        <PrivateRoute>
          <ProfilePage />
        </PrivateRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      <Route path="*" element={<div className="p-8 text-center">Page not found.</div>} />
    </Routes>
  );
}

function AppHeader() {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        setIsAdmin(data?.is_admin);
      } else {
        setIsAdmin(false);
      }
    }
    checkAdmin();
  }, [user]);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-orange-600">
          <span role="img" aria-label="logo">🍽️</span> Restaurant Finder
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-gray-700 hover:text-orange-600 font-medium">Home</Link>
          {user && <Link to="/profile" className="text-gray-700 hover:text-orange-600 font-medium">Profile</Link>}
          {user && isAdmin && <Link to="/admin" className="text-gray-700 hover:text-orange-600 font-medium">Admin</Link>}
          {user && <button onClick={signOut} className="text-red-600 hover:underline font-medium">Sign Out</button>}
          {user && <UserProfile />}
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppHeader />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
