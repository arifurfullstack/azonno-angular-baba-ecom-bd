const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/azonnox_db';

async function fixSettings() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    const shop = await db.collection('shops').findOne({});
    if (!shop) {
      console.log('No shop found');
      return;
    }
    
    const defaultThemeViewSettings = [
      { type: 'headerViews', value: ['Header 1'] },
      { type: 'brandViews', value: ['None'] },
      { type: 'productViews', value: ['Tag'] },
      { type: 'productCardViews', value: ['Product Card 1'] },
      { type: 'bottomNavViews', value: ['Bottom Nav 1'] },
      { type: 'footerViews', value: ['Footer 1'] },
      { type: 'categoryViews', value: ['Category 1'] },
      { type: 'showcaseViews', value: ['Showcase 1'] },
      { type: 'homeViews', value: ['default'] },
      { type: 'productsCategoryViews', value: ['Category 1'] },
      { type: 'filterBottomsheetCategoryViews', value: ['Category 1'] },
      { type: 'productDetailsViews', value: ['Product Details 1'] }
    ];

    await db.collection('settings').updateOne(
      { shop: shop._id },
      { 
        $set: { 
          themeViewSettings: defaultThemeViewSettings,
          "productSetting.isEnableProductDetailsView": true
        } 
      }
    );
    console.log('[OK] Updated MongoDB settings with themeViewSettings');

    // Also update shop-settings.json in themex/public and themex/dist/angular-ui/browser if exists
    const settings = await db.collection('settings').findOne({ shop: shop._id });
    const settingsData = {
      shop: shop._id.toString(),
      themeColors: settings.themeColors || { primary: "#4cac4d", secondary: "#00c153", tertiary: "#0778a8" },
      themeViewSettings: defaultThemeViewSettings,
      pageViewSettings: [],
      searchHints: 'laptop, mobile, headphone, keyboard',
      orderLanguage: 'bn',
      productSetting: settings.productSetting
    };

    const targetDirs = [
      path.join(__dirname, 'themex', 'public'),
      path.join(__dirname, 'themex', 'dist', 'angular-ui', 'browser'),
      path.join(__dirname, 'themex', 'dist', 'angular-ui', 'server')
    ];

    for (const dir of targetDirs) {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'shop-settings.json'), JSON.stringify(settingsData, null, 2), 'utf8');
      console.log('[OK] Wrote shop-settings.json to:', dir);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

fixSettings();
