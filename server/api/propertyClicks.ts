// server/api/propertyClicks.ts

import express from 'express';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

const router = express.Router();

// Record a property click
router.post('/', async (req, res) => {
  try {
    const { property_id, user_id, latitude, longitude } = req.body;

    if (!property_id) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    const { data, error } = await supabase
      .from('property_clicks')
      .insert([
        {
          property_id,
          user_id: user_id || null, // Allow anonymous clicks
          latitude: latitude || null,
          longitude: longitude || null,
          clicked_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error recording property click:', error);
    res.status(500).json({ 
      error: 'Failed to record property click',
      details: error.message 
    });
  }
});

// Get popular properties for a location
router.get('/popular', async (req, res) => {
  try {
    const { 
      latitude, 
      longitude, 
      radius = 50 // radius in kilometers
    } = req.query;

    // Convert query parameters to numbers
    const lat = latitude ? Number(latitude) : null;
    const lng = longitude ? Number(longitude) : null;
    const rad = Number(radius);

    // Base query for popular properties
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_clicks!inner (
          count
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (lat !== null && lng !== null) {
      // If location is provided, add location-based filters
      // Convert kilometers to approximate degrees (1 degree ≈ 111km at equator)
      const degreeRadius = rad / 111;
      
      query = query
        .gte('lat', lat - degreeRadius)
        .lte('lat', lat + degreeRadius)
        .gte('lng', lng - degreeRadius)
        .lte('lng', lng + degreeRadius);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform the response to include click count
    const transformedData = data.map(property => ({
      ...property,
      click_count: property.property_clicks?.length || 0
    }));

    res.json({ 
      success: true, 
      data: transformedData
    });
  } catch (error: any) {
    console.error('Error fetching popular properties:', error);
    res.status(500).json({ 
      error: 'Failed to fetch popular properties',
      details: error.message 
    });
  }
});

export default router;