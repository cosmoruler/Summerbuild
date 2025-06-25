import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper functions for authentication
export const auth = {
  // Sign up with email and password
  signUp: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getCurrentUser: () => {
    return supabase.auth.getUser()
  },

  // Listen to auth state changes
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Helper functions for saved restaurants
export const savedRestaurants = {
  // Get all saved restaurants for a user
  getSaved: async (userId) => {
    const { data, error } = await supabase
      .from('saved_restaurants')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    return { data, error }
  },

  // Add a restaurant to saved list
  add: async (userId, restaurant) => {
    // Ensure restaurant_id is always present and unique
    const restaurant_id =
      restaurant.id ||
      (restaurant.name && restaurant.lat && restaurant.lon
        ? `${restaurant.name}_${restaurant.lat}_${restaurant.lon}`
        : null);

    if (!restaurant_id) {
      throw new Error("Cannot save: restaurant has no unique identifier.");
    }

    const { data, error } = await supabase
      .from('saved_restaurants')
      .insert([
        {
          user_id: userId,
          restaurant_id, // use the generated id
          name: restaurant.name,
          cuisine: restaurant.cuisine,
          address: restaurant.address,
          lat: restaurant.lat,
          lon: restaurant.lon,
          rating: restaurant.rating,
          price_level: restaurant.price_level,
          website: restaurant.website,
          phone: restaurant.phone,
          opening_hours: restaurant.opening_hours,
          tags: restaurant.tags
        }
      ])
      .select();

    return { data, error };
  },

  // Remove a restaurant from saved list
  remove: async (userId, restaurantId) => {
    const { error } = await supabase
      .from('saved_restaurants')
      .delete()
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
    
    return { error }
  },

  // Check if a restaurant is saved
  isSaved: async (userId, restaurantId) => {
    const { data, error } = await supabase
      .from('saved_restaurants')
      .select('id')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single()
    
    return { isSaved: !!data, error }
  }
}

function getRestaurantId(restaurant) {
  return (
    restaurant.id ||
    (restaurant.name && restaurant.lat && restaurant.lon
      ? `${restaurant.name}_${restaurant.lat}_${restaurant.lon}`
      : null)
  );
} 