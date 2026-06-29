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

    const shop = await db.collection('shops').findOne({ status: 'active' });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin12345', salt);
    const now = new Date();

    // 1. Reset original admin password to admin12345
    await db.collection('vendors').updateOne(
      { username: 'admin' },
      { $set: { password: hashedPassword, updatedAt: now } }
    );
    console.log('[OK] Reset password for admin to admin12345');

    // 2. Reset admin2 password to admin12345
    const existingAdmin2 = await db.collection('vendors').findOne({ username: 'admin2' });
    let vendorId;
    if (existingAdmin2) {
      await db.collection('vendors').updateOne(
        { username: 'admin2' },
        { $set: { password: hashedPassword, updatedAt: now } }
      );
      vendorId = existingAdmin2._id;
      console.log('[OK] Reset password for admin2 to admin12345');
    } else {
      const dateString = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
      const vendorResult = await db.collection('vendors').insertOne({
        name: 'Secondary Admin',
        username: 'admin2',
        email: 'admin2@azonnox.com',
        phoneNo: '01700000001',
        isPasswordLess: false,
        password: hashedPassword,
        registrationType: 'default',
        role: 'owner',
        status: 'active',
        registrationAt: dateString,
        lastLoggedIn: null,
        failedLoginCount: 0,
        failedLoginStartTime: null,
        shops: shop ? [{ _id: shop._id, role: 'super_admin', pages: [], permissions: [] }] : [],
        createdAt: now,
        updatedAt: now
      });
      vendorId = vendorResult.insertedId;
      console.log('[OK] Created admin2 with password admin12345');
    }

    if (shop && vendorId) {
      await db.collection('shops').updateOne(
        { _id: shop._id, 'users._id': { $ne: vendorId } },
        {
          $push: {
            users: {
              _id: vendorId,
              username: 'admin2',
              email: 'admin2@azonnox.com',
              phoneNo: '01700000001',
              role: 'super_admin'
            }
          }
        }
      );
    }

    console.log('SUCCESS: Passwords updated');
  } catch (err) {
    console.error('[ERROR]', err.message);
  } finally {
    await client.close();
  }
}

createAdmin();
