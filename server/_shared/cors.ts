// server/_shared/cors.ts

// Cross-Origin Resource Sharing (CORS) headers
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  // Middleware to handle CORS for Express routes
  export const corsMiddleware = (req, res, next) => {
    // Set CORS headers on all responses
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.header(key, value);
    });
  
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  };