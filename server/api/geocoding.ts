// server/api/geocoding.ts

import express from 'express';
import { Client } from '@googlemaps/google-maps-services-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const googleMapsClient = new Client({});

// Geocoding endpoint
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }
    
    console.log(`Geocoding address: ${address}`);
    
    const response = await googleMapsClient.geocode({
      params: {
        address: address as string,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.status !== 'OK') {
      throw new Error(`Geocoding API error: ${response.data.status}`);
    }
    
    const { results } = response.data;
    
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No results found for this address' });
    }
    
    const location = results[0].geometry.location;
    const formattedAddress = results[0].formatted_address;
    
    // Extract components
    const addressComponents = results[0].address_components;
    const components = {
      street_number: '',
      route: '',
      locality: '',
      administrative_area_level_1: '',
      postal_code: '',
      country: ''
    };
    
    addressComponents.forEach(component => {
      const type = component.types[0];
      if (type in components) {
        components[type as keyof typeof components] = component.long_name;
      }
    });
    
    res.json({
      success: true,
      location,
      formattedAddress,
      components
    });
    
  } catch (error: any) {
    console.error('Geocoding error:', error);
    
    res.status(500).json({
      error: 'Failed to geocode address',
      details: error.message
    });
  }
});

// Reverse geocoding endpoint
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key is not configured' });
    }
    
    const response = await googleMapsClient.reverseGeocode({
      params: {
        latlng: {
          lat: parseFloat(lat as string),
          lng: parseFloat(lng as string)
        },
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    
    if (response.data.status !== 'OK') {
      throw new Error(`Reverse geocoding API error: ${response.data.status}`);
    }
    
    const { results } = response.data;
    
    if (!results || results.length === 0) {
      return res.status(404).json({ error: 'No results found for this location' });
    }
    
    const formattedAddress = results[0].formatted_address;
    
    // Extract components
    const addressComponents = results[0].address_components;
    const components = {
      street_number: '',
      route: '',
      locality: '',
      administrative_area_level_1: '',
      postal_code: '',
      country: ''
    };
    
    addressComponents.forEach(component => {
      const type = component.types[0];
      if (type in components) {
        components[type as keyof typeof components] = component.long_name;
      }
    });
    
    res.json({
      success: true,
      formattedAddress,
      components
    });
    
  } catch (error: any) {
    console.error('Reverse geocoding error:', error);
    
    res.status(500).json({
      error: 'Failed to reverse geocode',
      details: error.message
    });
  }
});

export default router;