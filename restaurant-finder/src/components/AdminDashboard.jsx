import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const ADMIN_SECRET = 'SummerBuild,2025'; // For dev only! Never expose in production.

const API_URL = 'http://localhost:4000/admin/users';

function AdminRoute({ children }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Fetch profile from Supabase and check is_admin
    // (You may want to move this logic to context for reuse)
    async function checkAdmin() {
      const res = await fetch(`/api/profile/${user.id}`);
      const profile = await res.json();
      setIsAdmin(profile.is_admin);
    }
    if (user) checkAdmin();
  }, [user]);

  if (!isAdmin) return <div>Not authorized</div>;
  return children;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', is_admin: false });
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState('');

  // Fetch user profiles (with is_admin)
  const fetchUsers = async () => {
    const res = await fetch(API_URL, {
      headers: { 'x-admin-secret': ADMIN_SECRET }
    });
    const data = await res.json();
    // Expecting data.users to be an array of { id, email, is_admin }
    setUsers(data.users || []);
  };

  useEffect(() => { fetchUsers(); }, []);

  // Add or update user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (editingUser) {
      // Update user
      const res = await fetch(`${API_URL}/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setMessage(data.error || 'User updated!');
    } else {
      // Create user
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': ADMIN_SECRET
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setMessage(data.error || 'User created!');
    }
    setForm({ email: '', password: '', is_admin: false });
    setEditingUser(null);
    fetchUsers();
  };

  // Edit user
  const handleEdit = (user) => {
    setEditingUser(user);
    setForm({ email: user.email, password: '', is_admin: user.is_admin });
  };

  // Delete user
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': ADMIN_SECRET }
    });
    fetchUsers();
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">User Management</h2>
      <button
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        onClick={() => { setEditingUser(null); setForm({ email: '', password: '', is_admin: false }); }}
      >
        + Add User
      </button>
      {/* Add/Edit User Form */}
      {(editingUser || form.email) && (
        <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap gap-2 items-center bg-yellow-50 p-3 rounded-lg shadow">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            className="px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="password"
            placeholder={editingUser ? "New Password (optional)" : "Password"}
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="px-3 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-orange-500"
          />
          <label className="flex items-center gap-1 text-gray-700">
            <input
              type="checkbox"
              checked={form.is_admin}
              onChange={e => setForm(f => ({ ...f, is_admin: e.target.checked }))}
            /> Admin
          </label>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            {editingUser ? "Update" : "Create"}
          </button>
          {editingUser && (
            <button type="button" className="px-3 py-2 bg-gray-200 rounded-lg" onClick={() => { setEditingUser(null); setForm({ email: '', password: '', is_admin: false }); }}>
              Cancel
            </button>
          )}
        </form>
      )}
      {message && <div className="mb-2 text-green-700">{message}</div>}
      {/* User Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm text-gray-900">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">#</th>
              <th className="px-4 py-2 text-left font-semibold">Email</th>
              <th className="px-4 py-2 text-left font-semibold">Admin</th>
              <th className="px-4 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  {u.is_admin
                    ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Yes</span>
                    : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">No</span>
                  }
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition" onClick={() => handleEdit(u)}>Edit</button>
                  <button className="px-3 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 transition" onClick={() => handleDelete(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}