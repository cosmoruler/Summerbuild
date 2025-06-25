require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Set these from your Supabase project settings
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Middleware to check admin secret
function checkAdmin(req, res, next) {
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// List users with is_admin
app.get('/admin/users', checkAdmin, async (req, res) => {
  // 1. Get all users from auth.users
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) return res.status(500).json({ error: usersError.message });

  // 2. Get all profiles (id, is_admin)
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, is_admin');
  if (profilesError) return res.status(500).json({ error: profilesError.message });

  // 3. Merge users and profiles by id, default is_admin to false if not found
  const usersWithAdmin = users.users.map(u => {
    const profile = profiles.find(p => p.id === u.id);
    return {
      id: u.id,
      email: u.email,
      is_admin: profile ? profile.is_admin : false,
    };
  });

  res.json({ users: usersWithAdmin });
});

// Create user
app.post('/admin/users', checkAdmin, async (req, res) => {
  const { email, password, is_admin } = req.body;
  // 1. Create user in auth
  const { data: user, error } = await supabase.auth.admin.createUser({ email, password });
  if (error) return res.status(500).json({ error: error.message });

  // 2. Insert profile row
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: user.user.id, is_admin: !!is_admin }]);
  if (profileError) return res.status(500).json({ error: profileError.message });

  res.json({ user: { id: user.user.id, email: user.user.email, is_admin: !!is_admin } });
});

// Update user
app.put('/admin/users/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;
  const { email, password, is_admin } = req.body;

  // 1. Update auth user
  const { data: user, error } = await supabase.auth.admin.updateUserById(id, { email, password });
  if (error) return res.status(500).json({ error: error.message });

  // 2. Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_admin: !!is_admin })
    .eq('id', id);
  if (profileError) return res.status(500).json({ error: profileError.message });

  res.json({ user: { id, email, is_admin: !!is_admin } });
});

// Delete user
app.delete('/admin/users/:id', checkAdmin, async (req, res) => {
  const { id } = req.params;

  // 1. Delete from auth
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return res.status(500).json({ error: error.message });

  // 2. Delete from profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);
  if (profileError) return res.status(500).json({ error: profileError.message });

  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Admin API running on port ${PORT}`));