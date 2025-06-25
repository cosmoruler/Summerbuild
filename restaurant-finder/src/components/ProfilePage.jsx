import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { savedRestaurants } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Heart, Trash2, Mail, Key, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchSaved();
      const handler = () => fetchSaved();
      window.addEventListener('saved-restaurants-updated', handler);
      return () => window.removeEventListener('saved-restaurants-updated', handler);
    }
  }, [user]);

  const fetchSaved = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await savedRestaurants.getSaved(user.id);
      if (error) throw error;
      setSaved(data || []);
    } catch (err) {
      setError('Failed to load saved restaurants.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (restaurantId) => {
    setError('');
    try {
      await savedRestaurants.remove(user.id, restaurantId);
      setSaved((prev) => prev.filter((r) => r.restaurant_id !== restaurantId));
    } catch (err) {
      setError('Failed to remove restaurant.');
    }
  };

  const handlePasswordReset = async () => {
    setError('');
    setResetEmailSent(false);
    try {
      // Supabase: send password reset email
      const { error } = await window.supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      setResetEmailSent(true);
    } catch (err) {
      setError('Failed to send password reset email.');
    }
  };

  if (!user) return <div className="p-8 text-center">Please sign in to view your profile.</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Home Button */}
      <div className="mb-4 flex justify-end">
        <Link to="/">
          <Button variant="outline" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-orange-500" />
            {user.email}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="flex items-center gap-2 w-fit" onClick={handlePasswordReset}>
              <Key className="h-4 w-4" />
              Reset Password
            </Button>
            {resetEmailSent && <p className="text-green-600 text-sm">Password reset email sent!</p>}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <Button variant="destructive" className="w-fit" onClick={signOut}>Sign Out</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Saved Restaurants
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center">Loading...</div>
          ) : saved.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No saved restaurants yet.</div>
          ) : (
            <div className="space-y-4">
              {saved.map((r) => (
                <div key={r.restaurant_id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.cuisine || 'Not specified'}</div>
                    <div className="text-xs text-gray-500">{r.address?.['addr:street'] || ''}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(r.restaurant_id)} title="Remove">
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage; 