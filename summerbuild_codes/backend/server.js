//included features: Basic input sanitization against invalid inputs or places outside of Singapore
//Supabase will provide some protection against SQL injections, so we can go to prevent invalid inputs from crashing the app. 
//rate limiting will also be added. 

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());

const GOOGLE_PLACES_API_KEY = "AIzaSyDMhI9HfNUU8bkTsQNXybVPkuwA-YSyigk";
const SUPABASE_URL = "https://sipklzkvgphzhnfrxsax.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpcGtsemt2Z3BoemhuZnJ4c2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0ODUwODMsImV4cCI6MjA2NDA2MTA4M30.mE6eZ1DJy7yDtt5lHEg3Nqc2ZsG9wBn_rrtiPAiIMGM";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.get('/restaurants', async (req, res) => {
  if (!req.query.lat || !req.query.lng || !req.query.type) {
    return res.status(400).json({ error: 'Missing required query parameters: lat, lng, type' });
  }

  // Validate latitude and longitude
  // Ensure that the longitude and latitude are valid
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  //verify once again. If invalid input, return error.
   if (isNaN(latNum) || isNaN(lngNum) || typeof type !== 'string') {
  return res.status(400).json({ error: 'Invalid query parameters' });
  }

  //assumption is that App is only doing mapping on singapore range. So Latitude 1.09 to 1.29 N, 103.36 to 104.24 E
  if (latNum < 1.09 || latNum > 1.29 || lngNum < 103.36 || lngNum > 104.24) {
    return res.status(400).json({ error: 'Latitude and longitude out of bounds for Singapore. Re-enter.' });
  }
  

  const { lat, lng, type } = req.query;
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=3000&type=restaurant&keyword=${type}&key=${GOOGLE_PLACES_API_KEY}`;

  try {
    const response = await axios.get(url);
    const restaurants = response.data.results;

    const inserts = restaurants.map(r => ({
      name: r.name,
      address: r.vicinity,
      rating: r.rating,
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng
    }));

    await supabase.from('restaurants').upsert(inserts, { onConflict: ['name', 'address'] });

    res.json(restaurants);


  } 
  //note: axios errors often have a response.data payload from the google API
  catch (error) {
    console.error(error?.response?.data || error.message); //to reveal the real cause of error
    res.status(500).json({ error: 'Failed to fetch data from Google API or Supabase' });
  }
});

//rate limiting code, to handle user traffic. Please use 'npm install express-rate-limit' after downloading this
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
});
app.use('/restaurants', limiter);




