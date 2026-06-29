/**
 * Create Additional Admin User Script
 */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = 'mongodb+srv://arifurfullstack_db_user:NoiRbJnmdOf2CoCG@clusterx.ewqe3mi.mongodb.net/azonnox_db?retryWrites=true&w=majority';

const NEW_ADMIN = {
  username: 'admin2',
  password: 'admin123456',
  name: 'Secondary Admin',
  email: 'admin2@azonnox.com',
  phoneNo: '01700000001'
};

async function createAdmin() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('[OK] Connected to MongoDB Atlas');
    const db = client.db();

    // Find active shop
    const shop = await db.collection('shops').findOne({ status: 'active' });
    if (!shop) {
      console.error('[ERROR] No active shop found.');
      return;
    }

    const existing = await db.collection('vendors').findOne({
      $or: [{ username: NEW_ADMIN.username }, { email: NEW_ADMIN.email }]
    });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(NEW_ADMIN.password, salt);
    const now = new Date();
    const dateString = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;

    let vendorId;
    if (existing) {
      console.log(`[!] User ${NEW_ADMIN.username} already exists. Updating password...`);
      await db.collection('vendors').updateOne(
        { _id: existing._id },
        { $set: { password: hashedPassword, updatedAt: now } }
      );
      vendorId = existing._id;
    } else {
      const vendorResult = await db.collection('vendors').insertOne({
        name: NEW_ADMIN.name,
        username: NEW_ADMIN.username,
        email: NEW_ADMIN.email,
        phoneNo: NEW_ADMIN.phoneNo,
        isPasswordLess: false,
        password: hashedPassword,
        registrationType: 'default',
        role: 'owner',
        status: 'active',
        registrationAt: dateString,
        lastLoggedIn: null,
        failedLoginCount: 0,
        failedLoginStartTime: null,
        shops: [
          {
            _id: shop._id,
            role: 'super_admin',
            pages: [],
            permissions: []
          }
        ],
        createdAt: now,
        updatedAt: now
      });
      vendorId = vendorResult.insertedId;
      console.log('[OK] Created new admin vendor. ID:', vendorId.toString());
    }

    // Add vendor to shop users if not present
    await db.collection('shops').updateOne(
      { _id: shop._id, 'users._id': { $ne: vendorId } },
      {
        $push: {
          users: {
            _id: vendorId,
            username: NEW_ADMIN.username,
            email: NEW_ADMIN.email,
            phoneNo: NEW_ADMIN.phoneNo,
            role: 'super_admin'
          }
        }
      }
    );

    console.log('SUCCESS: New admin created');
  } catch (err) {
    console.error('[ERROR]', err.message);
  } finally {
    await client.close();
  }
}

createAdmin();
