import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import AppServerModule from './src/main.server';
import * as dotenv from 'dotenv';
import fs from 'node:fs';

// Load environment variables
dotenv.config();

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });

  // Serve shop-settings.json dynamically from external volume mount or fallback to local browser dist folder
  server.get('/shop-settings.json', async (req, res): Promise<void> => {
    try {
      const host = req.headers.host || '';
      const cleanHost = host.replace('www.', '').split(':')[0];
      const protocol = (cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1')) ? 'http' : 'https';
      const apiBaseLink = process.env['API_BASE_LINK'] || `${protocol}://api.${cleanHost}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      try {
        const apiResponse = await fetch(`${apiBaseLink}/api/shop/get-setting-by-domain?domain=${cleanHost}`, {
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
    index: 'index.html',
  }));

  // All regular routes use the Angular engine
  server.get('**', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then((html) => {
        const apiBaseLink = process.env['API_BASE_LINK'] || `${protocol}://api.${headers.host.replace('www.', '')}`;
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
