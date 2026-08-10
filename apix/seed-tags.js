const path = require('path');
const { MongoClient } = require(path.join(__dirname, 'node_modules', 'mongodb'));

const MONGODB_URI = 'mongodb://127.0.0.1:27017/azonnox_db';

async function seedTags() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    
    const shop = await db.collection('shops').findOne({});
    if (!shop) return;
    
    const now = new Date();
    const dateString = `${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}`;
    
    const tagNames = ['Trending Now', 'Best Sellers', 'New Arrivals'];
    const tagIds = [];
    
    for (const name of tagNames) {
      let tag = await db.collection('tags').findOne({ shop: shop._id, name });
      if (!tag) {
        const res = await db.collection('tags').insertOne({
          shop: shop._id,
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          status: 'publish',
          priority: 0,
          dateString,
          createdAt: now,
          updatedAt: now
        });
        tagIds.push({ _id: res.insertedId, name });
        console.log('[OK] Created Tag:', name);
      } else {
        tagIds.push({ _id: tag._id, name: tag.name });
      }
    }
    
    // Attach tags to products
    const products = await db.collection('products').find({ shop: shop._id }).toArray();
    for (let i = 0; i < products.length; i++) {
      const tagToAssign = tagIds[i % tagIds.length];
      await db.collection('products').updateOne(
        { _id: products[i]._id },
        { $set: { tags: [tagToAssign] } }
      );
    }
    console.log('[OK] Assigned tags to all products');
    
    // Update themeViewSettings homeViews to 'home view 1'
    const settings = await db.collection('settings').findOne({ shop: shop._id });
    if (settings) {
      let tvs = settings.themeViewSettings || [];
      let hv = tvs.find(t => t.type === 'homeViews');
      if (hv) { hv.value = ['home view 1']; } else { tvs.push({ type: 'homeViews', value: ['home view 1'] }); }
      await db.collection('settings').updateOne({ shop: shop._id }, { $set: { themeViewSettings: tvs } });
      console.log('[OK] Set homeViews to home view 1');
    }
    
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

seedTags();
