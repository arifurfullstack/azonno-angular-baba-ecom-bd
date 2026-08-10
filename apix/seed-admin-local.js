/**
 * Azonnox - Database Seed Script
 * ================================
 * Creates the initial admin (vendor/owner) account and shop
 * so you can log into the admin panel.
 *
 * Usage: node seed-admin.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// ============================================
// CONFIGURATION - Change these as needed
// ============================================
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin12345';
const ADMIN_NAME = 'Super Admin';
const ADMIN_EMAIL = 'admin@azonnox.com';
const ADMIN_PHONE = '01700000000';
const SHOP_NAME = 'Azonnox Store';

// Read from .env or use default
// Force Google DNS so mongodb+srv SRV lookup works on ISPs that don't support SRV records
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/azonnox_db';

// ============================================

async function seed() {
  console.log('');
  console.log('========================================');
  console.log('  Azonnox - Database Seed Script');
  console.log('========================================');
  console.log('');

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('[OK] Connected to MongoDB Atlas');

    const db = client.db(); // uses db name from URI

    // Check if vendor already exists
    const existingVendor = await db
      .collection('vendors')
      .findOne({ username: ADMIN_USERNAME });

    if (existingVendor) {
      console.log('');
      console.log('[!] Admin vendor already exists!');
      console.log('    Username:', ADMIN_USERNAME);
      console.log('    ID:', existingVendor._id);
      console.log('');
      console.log('    If you forgot the password, delete the vendor from');
      console.log('    MongoDB Compass and run this script again.');
      console.log('');
      return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    const now = new Date();
    const dateString = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;

    // 1. Create the Vendor (Admin User)
    const vendorResult = await db.collection('vendors').insertOne({
      name: ADMIN_NAME,
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      phoneNo: ADMIN_PHONE,
      isPasswordLess: false,
      password: hashedPassword,
      registrationType: 'default',
      role: 'owner',
      status: 'active',
      registrationAt: dateString,
      lastLoggedIn: null,
      failedLoginCount: 0,
      failedLoginStartTime: null,
      shops: [],
      createdAt: now,
      updatedAt: now,
    });

    const vendorId = vendorResult.insertedId;
    console.log('[OK] Created admin vendor. ID:', vendorId.toString());

    // 2. Create the Shop
    const shopResult = await db.collection('shops').insertOne({
      websiteName: SHOP_NAME,
      domainType: 'subdomain',
      domain: 'localhost',
      owner: vendorId,
      users: [
        {
          _id: vendorId,
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          phoneNo: ADMIN_PHONE,
          role: 'super_admin',
        },
      ],
      status: 'active',
      shopType: 'ecommerce',
      registeredBy: 'self',
      trialPeriod: 0,
      buildStatus: 'complete',
      dateString: dateString,
      startDate: dateString,
      paymentStatus: 'paid',
      country: {
        name: 'Bangladesh',
        code: 'BD',
      },
      createdAt: now,
      updatedAt: now,
    });

    const shopId = shopResult.insertedId;
    console.log('[OK] Created shop. ID:', shopId.toString());

    // 3. Create default settings
    await db.collection('settings').insertOne({
      shop: shopId,
      websiteName: SHOP_NAME,
      themeColors: {
        primary: "#4cac4d",
        secondary: "#00c153",
        tertiary: "#0778a8"
      },
      searchHints: "laptop, mobile, headphone, keyboard",
      currency: {
        name: 'Bangladesh',
        code: 'BDT',
        symbol: 'à§³',
        countryCode: '880'
      },
      country: {
        name: 'Bangladesh',
        code: 'BD'
      },
      orderLanguage: 'bn',
      productSetting: {
        productType: 'physical',
        checkoutType: 'easyCheckout',
        urlType: 'website.com/product/test-product',
        isEnableSoldQuantitySort: false,
        isEnablePrioritySort: false,
        isEnablePhoneModel: false,
        isEnableProductKeyFeature: false,
        isEnableProductDetailsView: true,
        isEnableAdvancePayment: true,
        isEnableDeliveryCharge: true
      },
      facebookCatalog: {
        isEnableFacebookCatalog: false
      },
      createdAt: now,
      updatedAt: now
    });
    console.log('[OK] Created default settings for shop');

    // 4. Create default shop information
    await db.collection('shopinformations').insertOne({
      shop: shopId,
      websiteName: SHOP_NAME,
      fabIcon: 'https://cdn.saleecom.com/upload/static/favicon.ico',
      shortDescription: 'A Best Online shop in Bangladesh, All the product are available online.',
      socialLinks: [
        { type: 0, value: 'https://facebook.com' },
        { type: 5, value: 'https://tiktok.com' },
        { type: 1, value: 'https://youtube.com' },
        { type: 3, value: 'https://instagram.com' }
      ],
      addresses: [
        { type: null, value: 'Mirpur 10, Dhaka, Bangladesh' }
      ],
      emails: [
        { type: null, value: 'mail@gmail.com' }
      ],
      phones: [
        { type: null, value: '+8801000000000' }
      ],
      whatsappNumber: '+8801000000000',
      createdAt: now,
      updatedAt: now
    });
    console.log('[OK] Created default shop information');

    // 5. Link the shop back to the vendor
    await db.collection('vendors').updateOne(
      { _id: vendorId },
      {
        $push: {
          shops: {
            _id: shopId,
            role: 'super_admin',
            pages: [],
            permissions: [],
          },
        },
      },
    );
    console.log('[OK] Linked shop to vendor');

    // Summary
    console.log('');
    console.log('========================================');
    console.log('  SEED COMPLETE!');
    console.log('========================================');
    console.log('');
    console.log('  Admin Login Credentials:');
    console.log('  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€');
    console.log('  Username: ' + ADMIN_USERNAME);
    console.log('  Password: ' + ADMIN_PASSWORD);
    console.log('');
    console.log('  Shop: ' + SHOP_NAME);
    console.log('  Shop ID: ' + shopId.toString());
    console.log('');
    console.log('  Now go to http://localhost:4200 and login!');
    console.log('');
  } catch (error) {
    console.error('[ERROR] Failed to seed database:', error.message);
  } finally {
    await client.close();
    console.log('[OK] Disconnected from MongoDB');
  }
}

seed();

