// server/api/propertyClicks.ts

import express from 'express';
import { supabase } from '@/integrations/supabase/client';

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
      ]);

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
    const { latitude, longitude, radius = 50 } = req.query; // radius in kilometers

    let query = supabase
      .from('property_clicks')
      .select(`
        property_id,
        count(*) as click_count,
        properties(*)
      `)
      .gt('clicked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .group_by('property_id')
      .order('count', { ascending: false })
      .limit(10);

    if (latitude && longitude) {
      // If location is provided, filter by distance
      // Note: This is a simplified distance calculation
      query = query
        .gte('latitude', Number(latitude) - (radius/111))
        .lte('latitude', Number(latitude) + (radius/111))
        .gte('longitude', Number(longitude) - (radius/111))
        .lte('longitude', Number(longitude) + (radius/111));
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ 
      success: true, 
      data: data.map(item => ({
        ...item.properties,
        click_count: item.click_count
      }))
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