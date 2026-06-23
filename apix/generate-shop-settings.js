const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force Google DNS so mongodb+srv SRV lookup works on ISPs that don't support SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://arifurfullstack_db_user:NoiRbJnmdOf2CoCG@clusterx.ewqe3mi.mongodb.net/azonnox_db?retryWrites=true&w=majority';

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    // Find the first active shop
    const shop = await db.collection('shops').findOne({});
    if (!shop) {
      console.log('No shops found in the database!');
      return;
    }
    console.log('Found shop:', shop.websiteName, 'ID:', shop._id.toString());
    
    // Find settings for this shop
    const settings = await db.collection('settings').findOne({ shop: shop._id });
    if (!settings) {
      console.log('No settings found for shop:', shop._id);
      return;
    }
    
    const settingsData = {
      shop: shop._id.toString(),
      themeColors: settings.themeColors || {
        primary: "#4cac4d",
        secondary: "#00c153",
        tertiary: "#0778a8"
      },
      themeViewSettings: settings.themeViewSettings || [],
      pageViewSettings: settings.pageViewSettings || [],
      searchHints: settings.searchHints || 'laptop, mobile, headphone, keyboard',
      orderLanguage: settings.orderLanguage || 'en',
    };
    
    // Target theme public directory (up one level)
    const targetDir = path.join(__dirname, '..', 'themex', 'public');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const outputPath = path.join(targetDir, 'shop-settings.json');
    fs.writeFileSync(outputPath, JSON.stringify(settingsData, null, 2), 'utf8');
    console.log('Successfully wrote shop-settings.json to', outputPath);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

run();
