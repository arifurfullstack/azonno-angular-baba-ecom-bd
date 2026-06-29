import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import AppServerModule from './src/main.server';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import http from 'node:http';

// Load environment variables
dotenv.config();

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('trust proxy', true);
  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // 1. Proxy /api requests to internal NestJS API backend
  server.use('/api', (req, res) => {
    const internalApiPort = process.env['INTERNAL_API_PORT'] || process.env['PORT_API'] || 3000;
    const options: http.RequestOptions = {
      hostname: '127.0.0.1',
      port: internalApiPort,
      path: req.originalUrl,
      method: req.method,
      headers: { ...req.headers, host: req.headers.host }
    };
    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });
    proxyReq.on('error', (err) => {
      console.error('API proxy error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: 'API service unavailable' });
      }
    });
    req.pipe(proxyReq, { end: true });
  });

  // 2. Serve Admin Panel SPA files under /admin
  const candidateAdminFolders = [
    process.env['ADMIN_DIST_FOLDER'],
    resolve(serverDistFolder, '../../../../adminx/dist/angular-ui/browser'),
    resolve(process.cwd(), 'adminx/dist/angular-ui/browser'),
  ].filter((p): p is string => Boolean(p) && fs.existsSync(p));

  const adminDistFolder = candidateAdminFolders[0];
  if (adminDistFolder) {
    server.use('/admin', express.static(adminDistFolder, { maxAge: '1y' }));
    server.get('/admin*', (req, res) => {
      const isLocal = (req.headers.host || '').includes('localhost') || (req.headers.host || '').includes('127.0.0.1');
      const protocol = isLocal ? 'http' : (req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http');
      const apiBaseLink = process.env['API_BASE_LINK'] || `${protocol}://${req.headers.host}`;
      const envScript = `<script>window.__env = { apiBaseLink: '${apiBaseLink}' };</script>`;
      
      try {
        const html = fs.readFileSync(join(adminDistFolder, 'index.html'), 'utf-8');
        const modifiedHtml = html.replace('</head>', `${envScript}</head>`);
        res.send(modifiedHtml);
      } catch (e) {
        res.sendFile(join(adminDistFolder, 'index.html'));
      }
    });
  }

  // 3. Serve shop-settings.json dynamically from external volume mount or fallback to local browser dist folder
  server.get('/shop-settings.json', async (req, res): Promise<void> => {
    try {
      const host = req.headers.host || '';
      const cleanHost = host.replace('www.', '').split(':')[0];
      const internalApiPort = process.env['INTERNAL_API_PORT'] || process.env['PORT_API'] || 3000;
      const internalApiUrl = process.env['INTERNAL_API_URL'] || `http://127.0.0.1:${internalApiPort}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      try {
        const apiResponse = await fetch(`${internalApiUrl}/api/shop/get-setting-by-domain?domain=${cleanHost}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (apiResponse.ok) {
          const json = await apiResponse.json();
          if (json && json.success && json.data) {
            res.json(json.data);
            return;
          }
        }
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        console.warn('API fetch failed or timed out:', fetchErr.message);
      }
    } catch (e: any) {
      console.warn('Failed to load shop settings from API, falling back to local file:', e.message);
    }

    const externalPath = join('/app', 'settings', 'shop-settings.json');
    const localPath = join(browserDistFolder, 'shop-settings.json');
    if (fs.existsSync(externalPath)) {
      res.sendFile(externalPath);
      return;
    } else if (fs.existsSync(localPath)) {
      res.sendFile(localPath);
      return;
    } else {
      res.json({
        shop: '',
        themeColors: {
          primary: '#4cac4d',
          secondary: '#00c153',
          tertiary: '#0778a8'
        },
        themeViewSettings: [
          { type: 'headerViews', value: ['Header 1'] },
          { type: 'brandViews', value: ['None'] },
          { type: 'productViews', value: ['Tag'] },
          { type: 'productCardViews', value: ['Product Card 1'] },
          { type: 'bottomNavViews', value: ['Bottom Nav 1'] },
          { type: 'footerViews', value: ['Footer 1'] },
          { type: 'categoryViews', value: ['Category 1'] }
        ],
        pageViewSettings: [],
        searchHints: 'laptop, mobile',
        orderLanguage: 'en'
      });
      return;
    }
  });

  // Serve static files from /browser
  server.get('**', express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { originalUrl, baseUrl, headers } = req;
    const isLocal = (headers.host || '').includes('localhost') || (headers.host || '').includes('127.0.0.1');
    const protocol = isLocal ? 'http' : (req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http');

    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => {
        const apiBaseLink = process.env['API_BASE_LINK'] || `${protocol}://${headers.host}`;
        const envScript = `<script>window.__env = { apiBaseLink: '${apiBaseLink}' };</script>`;
        const modifiedHtml = html.replace('</head>', `${envScript}</head>`);
        res.send(modifiedHtml);
      })
      .catch((err) => next(err));
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4220;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
