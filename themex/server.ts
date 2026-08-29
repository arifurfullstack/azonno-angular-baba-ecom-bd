import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import AppServerModule from './src/main.server';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';

import compression from 'compression';

// Load environment variables
dotenv.config();

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  server.use(compression());
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('trust proxy', true);
  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // 1. Proxy /api requests to the NestJS API backend.
  //    The internal service is tried first; on error/timeout the public
  //    api.<host> origin is used as fallback for split-domain deployments
  //    where the API runs in a separate container.
  server.use('/api', (req, res) => {
    const internalApiPort = process.env['INTERNAL_API_PORT'] || process.env['PORT_API'] || 3000;
    const envBase = process.env['INTERNAL_API_URL'] || process.env['API_BASE_LINK'];
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
    const cleanHost = host.replace(/^www\./, '').split(':')[0];
    const isLocal = cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1');
    const publicBase = !isLocal && !envBase ? `https://api.${cleanHost}` : null;

    interface ProxyTarget {
      protocol: 'http:' | 'https:';
      hostname: string;
      port: string;
    }
    const targets: ProxyTarget[] = [];
    if (envBase) {
      const u = new URL(envBase);
      targets.push({
        protocol: u.protocol as 'http:' | 'https:',
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? '443' : '80')
      });
    } else {
      targets.push({ protocol: 'http:', hostname: '127.0.0.1', port: String(internalApiPort) });
      if (publicBase) {
        const u = new URL(publicBase);
        targets.push({
          protocol: u.protocol as 'http:' | 'https:',
          hostname: u.hostname,
          port: u.port || '443'
        });
      }
    }

    // Large bodies (file uploads) stream straight through without fallback;
    // small JSON bodies are buffered so a fallback target can replay them.
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > 2 * 1024 * 1024) {
      targets.length = 1;
      req.pipe(tryRequest(targets[0], 0, true), { end: true });
      return;
    }

    const chunks: Buffer[] = [];
    let bufferedBody: Buffer = Buffer.alloc(0);
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('aborted', () => { /* client went away */ });
    req.on('end', () => {
      bufferedBody = Buffer.concat(chunks);
      const proxyReq = tryRequest(targets[0], 0, false);
      if (bufferedBody.length) {
        proxyReq.write(bufferedBody);
      }
      proxyReq.end();
    });

    function tryRequest(target: ProxyTarget, index: number, piped: boolean): http.ClientRequest {
      const options: http.RequestOptions = {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: req.originalUrl,
        method: req.method,
        headers: {
          ...req.headers,
          host: target.port === '80' || target.port === '443'
            ? target.hostname
            : `${target.hostname}:${target.port}`
        },
        timeout: 3000
      };
      const proxyReq = target.protocol === 'https:'
        ? https.request(options)
        : http.request(options);
      proxyReq.on('response', (proxyRes) => {
        // An HTML 404 means the internal address is serving some other app
        // (or nothing mapped this route) — not the API. Fall back to the
        // next candidate instead of shipping that page to the client.
        const contentType = String(proxyRes.headers['content-type'] || '');
        const wrongService = proxyRes.statusCode === 404 && contentType.includes('text/html');
        if (wrongService && !piped && !res.headersSent && index + 1 < targets.length) {
          proxyRes.resume(); // drain the discarded response
          const retryReq = tryRequest(targets[index + 1], index + 1, false);
          if (bufferedBody.length) {
            retryReq.write(bufferedBody);
          }
          retryReq.end();
          return;
        }
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });
      proxyReq.on('timeout', () => proxyReq.destroy(new Error('API proxy timeout')));
      if (!piped) {
        proxyReq.on('error', () => {
          if (!res.headersSent && index + 1 < targets.length) {
            const retryReq = tryRequest(targets[index + 1], index + 1, false);
            if (bufferedBody.length) {
              retryReq.write(bufferedBody);
            }
            retryReq.end();
          } else if (!res.headersSent) {
            res.status(502).json({ success: false, message: 'API service unavailable' });
          }
        });
      } else {
        proxyReq.on('error', (err) => {
          console.error('API proxy error:', err.message);
          if (!res.headersSent) {
            res.status(502).json({ success: false, message: 'API service unavailable' });
          }
        });
      }
      return proxyReq;
    }
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

  // 3. Serve shop-settings.json dynamically from the API (internal first,
  //    then public api.<host>), with volume/file fallbacks.
  server.get('/shop-settings.json', async (req, res): Promise<void> => {
    try {
      const host = req.headers.host || '';
      const cleanHost = host.replace('www.', '').split(':')[0];
      const internalApiPort = process.env['INTERNAL_API_PORT'] || process.env['PORT_API'] || 3000;
      const internalApiUrl = process.env['INTERNAL_API_URL'] || `http://127.0.0.1:${internalApiPort}`;
      const isLocal = cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1');
      const candidates = process.env['INTERNAL_API_URL']
        ? [internalApiUrl]
        : isLocal
          ? [internalApiUrl]
          : [internalApiUrl, `https://api.${cleanHost}`];

      for (const base of candidates) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        try {
          const apiResponse = await fetch(`${base}/api/shop/get-setting-by-domain?domain=${cleanHost}`, {
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
          console.warn(`Shop settings fetch from ${base} failed:`, fetchErr.message);
        }
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

    const host = (headers['x-forwarded-host'] as string) || headers.host || '';
    const cleanHost = host.replace(/^www\./, '').split(':')[0];

    commonEngine
      .render({
        bootstrap: AppServerModule,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        providers: [
          { provide: APP_BASE_HREF, useValue: baseUrl },
          { provide: 'REQUEST_DOMAIN', useValue: cleanHost }
        ],
      })
      .then((html) => {
        const cleanHost = (headers.host || '').replace(/^www\./, '');
        const autoApiLink = !isLocal ? `${protocol}://api.${cleanHost}` : `${protocol}://${headers.host}`;
        const apiBaseLink = process.env['API_BASE_LINK'] || autoApiLink;
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
