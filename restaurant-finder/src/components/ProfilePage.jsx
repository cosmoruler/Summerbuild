import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { savedRestaurants } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Heart, Trash2, Mail, Key, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatNewPassword, setRepeatNewPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordChangeMessage('');
    if (newPassword !== repeatNewPassword) {
      setPasswordChangeMessage('New passwords do not match.');
      return;
    }
    setPasswordChangeLoading(true);
    try {
      // 1. Re-authenticate user with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        setPasswordChangeMessage('Current password is incorrect.');
        setPasswordChangeLoading(false);
        return;
      }
      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setPasswordChangeMessage('Failed to update password.');
      } else {
        setPasswordChangeMessage('Password updated successfully!');
        setShowPasswordForm(false);
        setCurrentPassword('');
        setNewPassword('');
        setRepeatNewPassword('');
      }
    } catch (err) {
      setPasswordChangeMessage('An error occurred. Please try again.');
    } finally {
      setPasswordChangeLoading(false);
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
            <Button
              variant="outline"
              className="flex items-center gap-2 w-fit"
              onClick={() => setShowPasswordForm((v) => !v)}
            >
              <Key className="h-4 w-4" />
              Reset Password
            </Button>
            {showPasswordForm && (
              <form onSubmit={handlePasswordChange} className="flex flex-col gap-2 mt-4 max-w-xs">
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="border rounded px-3 py-2 w-full pr-8"
                    required
                  />
                  {currentPassword && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                      onClick={() => setCurrentPassword('')}
                      tabIndex={-1}
                      aria-label="Clear current password"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="border rounded px-3 py-2 w-full pr-8"
                    required
                  />
                  {newPassword && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                      onClick={() => setNewPassword('')}
                      tabIndex={-1}
                      aria-label="Clear new password"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={repeatNewPassword}
                    onChange={e => setRepeatNewPassword(e.target.value)}
                    className="border rounded px-3 py-2 w-full pr-8"
                    required
                  />
                  {repeatNewPassword && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                      onClick={() => setRepeatNewPassword('')}
                      tabIndex={-1}
                      aria-label="Clear repeat new password"
                    >
                      ×
                    </button>
                  )}
                </div>
                <Button type="submit" disabled={passwordChangeLoading}>
                  {passwordChangeLoading ? 'Updating...' : 'Change Password'}
                </Button>
                {passwordChangeMessage && (
                  <p className={`text-sm mt-2 ${passwordChangeMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordChangeMessage}
                  </p>
                )}
              </form>
            )}
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