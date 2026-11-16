const { getDefaultConfig } = require('expo/metro-config');
const http = require('http');

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      // Forward all /api requests to local backend running on port 3000
      if (req.url && req.url.startsWith('/api')) {
        // Handle CORS preflight directly
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          });
          res.end();
          return;
        }

        const proxyReq = http.request(
          {
            hostname: '127.0.0.1',
            port: 3000,
            path: req.url,
            method: req.method,
            headers: {
              ...req.headers,
              host: '127.0.0.1:3000',
            },
          },
          (proxyRes) => {
            const headers = { ...proxyRes.headers };
            headers['access-control-allow-origin'] = '*';
            headers['access-control-allow-headers'] = 'Content-Type, Authorization';
            res.writeHead(proxyRes.statusCode, headers);
            proxyRes.pipe(res, { end: true });
          }
        );

        proxyReq.on('error', (err) => {
          console.error('[Metro API Proxy Error]:', err.message);
          res.writeHead(502, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          });
          res.end(
            JSON.stringify({
              error: {
                code: 'BAD_GATEWAY',
                message: 'Backend server on port 3000 is not reachable.',
              },
            })
          );
        });

        if (req.readableEnded || req.method === 'GET' || req.method === 'HEAD') {
          proxyReq.end();
        } else {
          req.pipe(proxyReq, { end: true });
        }
        return;
      }
      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
