// src/prerender/prerender.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../pages/product/product.service';

@Injectable()
export class PrerenderMiddleware implements NestMiddleware {
  constructor(private readonly productsService: ProductService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const userAgent = req.headers['user-agent']?.toLowerCase() || '';
    console.log('userAgent', userAgent);
    const crawlerAgents = [
      'facebookexternalhit',
      'twitterbot',
      'googlebot',
      'bingbot',
      'linkedinbot',
      'whatsapp',
    ];

    const isCrawler = crawlerAgents.some((agent) => userAgent.includes(agent));

    const domain = req.get('host');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    console.log('baseUrl', baseUrl);

    // Query parameter গুলো পড়া (যদি প্রয়োজন হয়)
    // const queryParams = req.query;
    // console.log('Query Params:', queryParams);

    console.log('isCrawler', isCrawler);
    console.log('req.path', req.path);

    // For Homepage
    if (
      isCrawler &&
      (req.path === '/api' || req.path === '/api/' || req.path === '')
    ) {
      const shopInfo =
        await this.productsService.getShopByDomainForPrerender(domain);

      console.log('shopInfo', shopInfo);

      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home</title>
  <meta property="og:title" content="${shopInfo.websiteName}" />
  <meta property="og:description" content="${shopInfo.shortDescription}" />
  <meta property="og:image" content="${shopInfo.logoPrimary}" />
  <meta property="og:url" content="${fullUrl}" />
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <p>Loading...</p>
<script>
  setTimeout(function() {
    window.location.href = '${fullUrl}';
  }, 1000);
</script>

</body>
</html>
      `;
      return res.send(html);
    }

    // প্রোডাক্ট ডিটেইলস পেজের জন্য (URL: /product-details/:slug)
    if (isCrawler && req.path.startsWith('/api/product-details/')) {
      const parts = req.path.split('/');
      const slug = parts[parts.length - 1];
      const select = 'name images';

      const product = await this.productsService.getProductBySlugForPrerender(
        domain,
        slug,
        select,
      );
      if (product) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.name}</title>
  <meta property="og:title" content="${product.name}" />
<!--  <meta property="og:description" content="${product.description}" />-->
  <meta property="og:image" content="${product.images && product.images.length ? product.images[0] : ''}" />
  <meta property="og:url" content="${fullUrl}" />
  <meta name="twitter:card" content="summary_large_image">
</head>
<body>
  <p>Loading...</p>
<script>
  setTimeout(function() {
    window.location.href = '${fullUrl}';
  }, 1000);
</script>

</body>
</html>
        `;
        return res.send(html);
      }
    }
    // যদি crawler না হয় বা কোনো কন্ডিশন ম্যাচ না করে, তাহলে পরবর্তী middleware বা controller-এ পাঠান
    next();
  }
}
