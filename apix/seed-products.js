/**
 * Azonnox - Dummy Products Seed Script
 * Inserts categories + 20 realistic dummy products into local MongoDB
 * Usage: node apix/seed-products.js
 */

const { MongoClient, ObjectId } = require('mongodb');
const MONGODB_URI = 'mongodb://127.0.0.1:27017/azonnox_db';

const slugify = (text) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

// Realistic product images from picsum (stable, always available)
const img = (id, w = 600, h = 600) => `https://picsum.photos/seed/${id}/${w}/${h}`;

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('[OK] Connected to MongoDB');
    const db = client.db();

    // Get the shop we created
    const shop = await db.collection('shops').findOne({});
    if (!shop) { console.error('[ERR] No shop found. Run seed-admin.js first!'); return; }
    const shopId = shop._id;
    console.log('[OK] Found shop:', shop.websiteName, '| ID:', shopId.toString());

    const now = new Date();
    const dateString = `${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}`;

    // ── 1. CREATE CATEGORIES ──────────────────────────────────────
    const cats = [
      { name: 'Electronics',  images: [img('electronics', 400, 400)] },
      { name: 'Fashion',      images: [img('fashion', 400, 400)] },
      { name: 'Home & Living',images: [img('home', 400, 400)] },
      { name: 'Beauty',       images: [img('beauty', 400, 400)] },
      { name: 'Sports',       images: [img('sports', 400, 400)] },
    ];

    const categoryIds = {};
    for (const c of cats) {
      const existing = await db.collection('categories').findOne({ shop: shopId, name: c.name });
      if (existing) { categoryIds[c.name] = existing._id; console.log(`[--] Category exists: ${c.name}`); continue; }
      const r = await db.collection('categories').insertOne({
        shop: shopId, name: c.name, slug: slugify(c.name),
        images: c.images, status: 'publish', priority: 0,
        dateString, createdAt: now, updatedAt: now
      });
      categoryIds[c.name] = r.insertedId;
      console.log(`[OK] Category: ${c.name}`);
    }

    // ── 2. PRODUCT DATA ───────────────────────────────────────────
    const products = [
      // Electronics
      { name: 'Wireless Noise Cancelling Headphones', cat: 'Electronics', regularPrice: 4500, salePrice: 3200, costPrice: 2000, qty: 50, images: [img('headphones1'),img('headphones2')], desc: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and foldable design. Perfect for travel and studio use.', sku: 'ELEC-001', unit: 'pcs', warranty: '1 Year', weight: 0.35 },
      { name: 'Smart Watch Pro X',                   cat: 'Electronics', regularPrice: 6500, salePrice: 4999, costPrice: 3000, qty: 35, images: [img('smartwatch1'),img('smartwatch2')], desc: 'Feature-rich smartwatch with heart rate monitor, GPS, sleep tracking, 7-day battery, and 50+ sport modes.', sku: 'ELEC-002', unit: 'pcs', warranty: '1 Year', weight: 0.08 },
      { name: 'Portable Bluetooth Speaker',          cat: 'Electronics', regularPrice: 2800, salePrice: 1999, costPrice: 1200, qty: 80, images: [img('speaker1'),img('speaker2')], desc: 'Waterproof IPX7 portable speaker with 360° surround sound, 24-hour playtime, and built-in power bank.', sku: 'ELEC-003', unit: 'pcs', warranty: '1 Year', weight: 0.45 },
      { name: 'Mechanical Gaming Keyboard',          cat: 'Electronics', regularPrice: 3500, salePrice: 2799, costPrice: 1800, qty: 25, images: [img('keyboard1'),img('keyboard2')], desc: 'RGB backlit mechanical keyboard with tactile blue switches, N-key rollover, USB-C connectivity, and detachable cable.', sku: 'ELEC-004', unit: 'pcs', warranty: '2 Years', weight: 0.9 },
      { name: '4K Action Camera Ultra',              cat: 'Electronics', regularPrice: 8500, salePrice: 6999, costPrice: 4500, qty: 20, images: [img('camera1'),img('camera2')], desc: 'Shoot stunning 4K/60fps video and 20MP photos. Waterproof up to 10m, built-in stabilization, wide-angle lens.', sku: 'ELEC-005', unit: 'pcs', warranty: '1 Year', weight: 0.12 },

      // Fashion
      { name: 'Premium Cotton Polo Shirt',           cat: 'Fashion', regularPrice: 1200, salePrice: 899, costPrice: 500, qty: 150, images: [img('polo1'),img('polo2')], desc: 'Breathable 100% premium Pima cotton polo shirt. Available in multiple colors. Classic fit, perfect for casual and semi-formal occasions.', sku: 'FASH-001', unit: 'pcs', weight: 0.25 },
      { name: 'Slim Fit Chino Pants',                cat: 'Fashion', regularPrice: 2200, salePrice: 1599, costPrice: 900, qty: 100, images: [img('chino1'),img('chino2')], desc: 'Modern slim-fit chinos made from stretch cotton blend. Comfortable, durable, and versatile for work or weekend wear.', sku: 'FASH-002', unit: 'pcs', weight: 0.5 },
      { name: "Women's Floral Midi Dress",           cat: 'Fashion', regularPrice: 2800, salePrice: 1999, costPrice: 1100, qty: 75, images: [img('dress1'),img('dress2')], desc: 'Elegant floral print midi dress with puffed sleeves and smocked waist. Lightweight, perfect for summer occasions.', sku: 'FASH-003', unit: 'pcs', weight: 0.3 },
      { name: 'Leather Bifold Wallet',               cat: 'Fashion', regularPrice: 1500, salePrice: 999, costPrice: 600, qty: 200, images: [img('wallet1'),img('wallet2')], desc: 'Genuine full-grain leather bifold wallet with 8 card slots, 2 cash compartments, and RFID blocking technology.', sku: 'FASH-004', unit: 'pcs', weight: 0.09 },
      { name: 'Running Sneakers Pro',                cat: 'Fashion', regularPrice: 4500, salePrice: 3299, costPrice: 2200, qty: 60, images: [img('sneakers1'),img('sneakers2')], desc: 'High-performance running shoes with responsive cushioning, breathable mesh upper, and durable rubber outsole.', sku: 'FASH-005', unit: 'pcs', warranty: '6 Months', weight: 0.65 },

      // Home & Living
      { name: 'Aromatherapy Diffuser & Humidifier',  cat: 'Home & Living', regularPrice: 2200, salePrice: 1599, costPrice: 900, qty: 45, images: [img('diffuser1'),img('diffuser2')], desc: '400ml ultrasonic essential oil diffuser with 7 LED color modes, auto shut-off, and whisper-quiet operation.', sku: 'HOME-001', unit: 'pcs', weight: 0.55 },
      { name: 'Non-Stick Cookware Set (5 Pcs)',      cat: 'Home & Living', regularPrice: 5500, salePrice: 3999, costPrice: 2500, qty: 30, images: [img('cookware1'),img('cookware2')], desc: 'Granite-coated non-stick 5-piece cookware set. Includes saucepan, frying pan, and wok. Induction compatible, dishwasher safe.', sku: 'HOME-002', unit: 'set', warranty: '2 Years', weight: 3.5 },
      { name: 'Bamboo Bedside Table Lamp',           cat: 'Home & Living', regularPrice: 1800, salePrice: 1299, costPrice: 750, qty: 55, images: [img('lamp1'),img('lamp2')], desc: 'Warm ambient bamboo table lamp with 3-level touch dimmer, USB charging port, and energy-saving LED bulb included.', sku: 'HOME-003', unit: 'pcs', weight: 0.8 },
      { name: 'Memory Foam Lumbar Pillow',           cat: 'Home & Living', regularPrice: 1500, salePrice: 999, costPrice: 550, qty: 90, images: [img('pillow1'),img('pillow2')], desc: 'Ergonomic memory foam lumbar support pillow for office chairs, car seats, and couches. Washable velvet cover.', sku: 'HOME-004', unit: 'pcs', weight: 0.6 },
      { name: 'Wall Clock Modern Minimalist',        cat: 'Home & Living', regularPrice: 1200, salePrice: 849, costPrice: 450, qty: 70, images: [img('clock1'),img('clock2')], desc: 'Silent sweep mechanism wall clock. 12-inch diameter, metal frame, Arabic numerals, battery operated (AA x1).', sku: 'HOME-005', unit: 'pcs', weight: 0.4 },

      // Beauty
      { name: 'Vitamin C Brightening Serum',         cat: 'Beauty', regularPrice: 1800, salePrice: 1299, costPrice: 700, qty: 120, images: [img('serum1'),img('serum2')], desc: '20% Vitamin C + Hyaluronic Acid + Vitamin E face serum. Reduces dark spots, evens skin tone, and boosts collagen.', sku: 'BEAU-001', unit: 'bottle', weight: 0.05 },
      { name: 'Charcoal Deep Cleanse Face Wash',     cat: 'Beauty', regularPrice: 750, salePrice: 549, costPrice: 280, qty: 200, images: [img('facewash1'),img('facewash2')], desc: 'Activated charcoal facial cleanser that deeply unclogs pores, removes excess oil, and leaves skin feeling fresh.', sku: 'BEAU-002', unit: 'pcs', weight: 0.15 },
      { name: 'Argan Oil Hair Treatment Mask',       cat: 'Beauty', regularPrice: 1200, salePrice: 899, costPrice: 480, qty: 85, images: [img('hairmask1'),img('hairmask2')], desc: 'Intensive repair hair mask with pure Moroccan Argan Oil. Restores shine, softness, and strength in damaged hair.', sku: 'BEAU-003', unit: 'pcs', weight: 0.25 },

      // Sports
      { name: 'Yoga Mat Premium Non-Slip',           cat: 'Sports', regularPrice: 2500, salePrice: 1799, costPrice: 1000, qty: 65, images: [img('yogamat1'),img('yogamat2')], desc: '6mm thick TPE eco-friendly yoga mat. Extra wide (183x68cm), double-sided non-slip texture, with carry strap.', sku: 'SPRT-001', unit: 'pcs', weight: 1.1 },
      { name: 'Adjustable Dumbbell Set 10kg',        cat: 'Sports', regularPrice: 4500, salePrice: 3499, costPrice: 2200, qty: 40, images: [img('dumbbell1'),img('dumbbell2')], desc: 'Cast iron adjustable dumbbell set with spin-lock collars and chrome-plated steel bar. Ideal for home workouts.', sku: 'SPRT-002', unit: 'set', warranty: '1 Year', weight: 10.5 },
      { name: 'Resistance Bands Set (5 Levels)',     cat: 'Sports', regularPrice: 1200, salePrice: 799, costPrice: 400, qty: 130, images: [img('bands1'),img('bands2')], desc: 'Set of 5 latex resistance bands (10-50 lbs). Perfect for stretching, physical therapy, and strength training.', sku: 'SPRT-003', unit: 'set', weight: 0.35 },
    ];

    // ── 3. INSERT PRODUCTS ────────────────────────────────────────
    let inserted = 0;
    for (const p of products) {
      const catId = categoryIds[p.cat];
      const slug = slugify(p.name);
      const existing = await db.collection('products').findOne({ shop: shopId, slug });
      if (existing) { console.log(`[--] Product exists: ${p.name}`); continue; }

      const discountAmount = p.regularPrice - p.salePrice;
      const discountPct = Math.round((discountAmount / p.regularPrice) * 100);

      await db.collection('products').insertOne({
        shop: shopId,
        name: p.name,
        slug,
        autoSlug: true,
        category: catId ? { _id: catId, name: p.cat, slug: slugify(p.cat), images: [] } : {},
        subCategory: {},
        childCategory: {},
        brand: {},
        tags: [],
        images: p.images,
        videoUrl: '',
        description: p.desc,
        sku: p.sku,
        unit: p.unit || 'pcs',
        warranty: p.warranty || '',
        weight: p.weight || 0,
        costPrice: p.costPrice,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice,
        discountType: 'percentage',
        discountAmount: discountPct,
        deliveryCharge: { insideCity: 60, outsideCity: 120 },
        advancePayment: 0,
        quantity: p.qty,
        isVariation: false,
        variation: '',
        variationOptions: [],
        variation2: '',
        variation2Options: [],
        variationList: [],
        totalSold: Math.floor(Math.random() * 80),
        totalView: Math.floor(Math.random() * 500) + 50,
        ratingCount: Math.floor(Math.random() * 40),
        ratingTotal: Math.floor(Math.random() * 200),
        reviewTotal: Math.floor(Math.random() * 20),
        ratingDetails: { oneStar: 0, twoStar: 1, threeStar: 3, fourStar: 8, fiveStar: 12 },
        status: 'publish',
        priority: 0,
        isFacebookCatalog: false,
        isAffiliateProduct: false,
        isWholesale: false,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        dateString,
        specifications: [],
        createdAt: now,
        updatedAt: now,
      });
      inserted++;
      console.log(`[OK] Product: ${p.name} (${p.cat}) — ৳${p.salePrice}`);
    }

    console.log('');
    console.log('=========================================');
    console.log(`  DONE! ${inserted} products seeded.`);
    console.log('=========================================');
    console.log('  Visit: http://localhost:4220/');
    console.log('  Admin: http://localhost:4220/admin');
    console.log('');
  } catch (err) {
    console.error('[ERROR]', err.message);
  } finally {
    await client.close();
    console.log('[OK] Disconnected from MongoDB');
  }
}

seed();
