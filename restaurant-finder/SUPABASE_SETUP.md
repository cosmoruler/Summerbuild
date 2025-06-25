# Supabase Setup Guide

This guide will help you set up Supabase for the Restaurant Finder app with user authentication and saved restaurants functionality.

## Step 1: Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: "Restaurant Finder"
   - Database Password: Choose a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to Settings > API
2. Copy the following values:
   - Project URL
   - Anon public key

## Step 3: Configure Environment Variables

1. Create a `.env` file in the `restaurant-finder` directory
2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 4: Set Up Database Tables

### Create the `saved_restaurants` table

1. In your Supabase dashboard, go to SQL Editor
2. Run the following SQL to create the table:

```sql
-- Create saved_restaurants table
CREATE TABLE saved_restaurants (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  cuisine TEXT,
  address JSONB,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  rating TEXT,
  price_level TEXT,
  website TEXT,
  phone TEXT,
  opening_hours TEXT,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_saved_restaurants_user_id ON saved_restaurants(user_id);
CREATE INDEX idx_saved_restaurants_restaurant_id ON saved_restaurants(restaurant_id);
CREATE UNIQUE INDEX idx_saved_restaurants_user_restaurant ON saved_restaurants(user_id, restaurant_id);

-- Enable Row Level Security (RLS)
ALTER TABLE saved_restaurants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved restaurants" ON saved_restaurants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved restaurants" ON saved_restaurants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved restaurants" ON saved_restaurants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved restaurants" ON saved_restaurants
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_saved_restaurants_updated_at 
    BEFORE UPDATE ON saved_restaurants 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Step 5: Configure Authentication

### Enable Email Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Under "Auth Providers", make sure "Email" is enabled
3. Configure email templates (optional):
   - Go to Authentication > Email Templates
   - Customize the confirmation and reset password emails

### Configure Site URL

1. In Authentication > Settings, set your Site URL:
   - Development: `http://localhost:5173`
   - Production: Your production domain

### Configure Redirect URLs

1. In Authentication > Settings, add redirect URLs:
   - `http://localhost:5173`
   - Your production domain

## Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open the app in your browser
3. Try to sign up with an email and password
4. Check your email for the confirmation link
5. Sign in and test saving/unsaving restaurants

## Step 7: Production Deployment

### Environment Variables

When deploying to production, make sure to set the environment variables:

```env
VITE_SUPABASE_URL=your_production_project_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### Update Site URL and Redirect URLs

1. In your Supabase dashboard, update the Site URL to your production domain
2. Add your production domain to the redirect URLs list

## Database Schema Overview

### `saved_restaurants` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `restaurant_id` | TEXT | Unique restaurant identifier |
| `name` | TEXT | Restaurant name |
| `cuisine` | TEXT | Cuisine type |
| `address` | JSONB | Address information |
| `lat` | DOUBLE PRECISION | Latitude |
| `lon` | DOUBLE PRECISION | Longitude |
| `rating` | TEXT | Restaurant rating |
| `price_level` | TEXT | Price level |
| `website` | TEXT | Website URL |
| `phone` | TEXT | Phone number |
| `opening_hours` | TEXT | Opening hours |
| `tags` | JSONB | Additional tags |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Security Features

- **Row Level Security (RLS)**: Users can only access their own saved restaurants
- **Authentication**: Email/password authentication with email confirmation
- **Data Validation**: Database constraints ensure data integrity
- **Indexes**: Optimized queries for better performance

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**: Check your environment variables
2. **"Table doesn't exist" error**: Make sure you've run the SQL commands
3. **"RLS policy violation" error**: Check that RLS policies are correctly set up
4. **Email not received**: Check spam folder and email templates configuration

### Useful SQL Queries

```sql
-- Check saved restaurants for a user
SELECT * FROM saved_restaurants WHERE user_id = 'user-uuid-here';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'saved_restaurants';

-- Check table structure
\d saved_restaurants
```

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Design](https://supabase.com/docs/guides/database) 